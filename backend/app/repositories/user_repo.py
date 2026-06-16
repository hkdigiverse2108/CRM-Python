"""
User Repository
================
MySQL database implementation of user data access.
Isolation is guaranteed by workspace_id, and role translation is performed
between composite database role IDs and domain model role strings.
"""

import uuid
from datetime import datetime, timezone
from typing import Any, Optional
import anyio
from sqlalchemy import text

from backend.app.models.user import User
from backend.app.repositories.base import BaseRepository
from backend.app.core.database import get_db


class UserRepository(BaseRepository[User]):
    """
    MySQL database repository for SaaS CRM users.
    Filters all queries by workspace_id to guarantee tenant data isolation.
    """

    def _role_id_to_role(self, role_id: str) -> str:
        """Translate composite database role_id to simple role string."""
        if not role_id:
            return ""
        if role_id.startswith("role_super_admin_"):
            return "super_admin"
        elif role_id.startswith("role_admin_001_"):
            return "admin"
        elif role_id.startswith("role_mgr_001_"):
            return "manager"
        elif role_id.startswith("role_agent_001_"):
            return "agent"
        elif role_id.startswith("role_support_001_"):
            return "support"
        elif role_id.startswith("role_accountant_001_"):
            return "finance"
        
        # Fallback parsing for role_<role_name>_<workspace_id>
        if role_id.startswith("role_"):
            parts = role_id.split("_")
            if len(parts) >= 3:
                return parts[1]
        return role_id

    def _role_to_role_id(self, role: str, workspace_id: str) -> str:
        """Translate simple role string to composite database role_id."""
        if role.startswith("role_"):
            return role
        # If role is already a UUID (e.g. custom role ID), return it as is
        try:
            import uuid
            uuid.UUID(role)
            return role
        except ValueError:
            pass
        # Backwards compatible translations for standard string roles
        if role == "super_admin":
            return f"role_super_admin_{workspace_id}"
        elif role == "admin":
            return f"role_admin_001_{workspace_id}"
        elif role == "manager":
            return f"role_mgr_001_{workspace_id}"
        elif role == "agent":
            return f"role_agent_001_{workspace_id}"
        elif role == "support":
            return f"role_support_001_{workspace_id}"
        elif role == "finance":
            return f"role_accountant_001_{workspace_id}"
        return f"role_{role}_{workspace_id}"

    def _row_to_user(self, row: dict[str, Any]) -> User:
        """Map database row dict to User domain model."""
        created_at = row["created_at"]
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        elif created_at and not created_at.tzinfo:
            created_at = created_at.replace(tzinfo=timezone.utc)

        updated_at = row["updated_at"]
        if isinstance(updated_at, str):
            updated_at = datetime.fromisoformat(updated_at)
        elif updated_at and not updated_at.tzinfo:
            updated_at = updated_at.replace(tzinfo=timezone.utc)

        return User(
            id=row["user_id"],
            email=row["email"],
            hashed_password=row["password_hash"],
            full_name=row["full_name"],
            role=self._role_id_to_role(row["role_id"]),
            is_active=row["status"] == "active",
            tenant_id=row["workspace_id"],
            phone=row["phone"],
            avatar_url=row["avatar_url"],
            created_at=created_at or datetime.now(timezone.utc),
            updated_at=updated_at or datetime.now(timezone.utc),
        )

    async def get_by_id(self, entity_id: str, tenant_id: str) -> Optional[User]:
        """Retrieve user by ID within tenant scope."""
        def _get():
            with get_db() as db:
                sql = text("""
                    SELECT * FROM users 
                    WHERE user_id = :user_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {"user_id": entity_id, "workspace_id": tenant_id}).mappings().first()
                if not res:
                    return None
                return self._row_to_user(res)
        return await anyio.to_thread.run_sync(_get)

    async def get_by_email(self, email: str, tenant_id: str) -> Optional[User]:
        """Retrieve user by email within tenant scope."""
        def _get():
            with get_db() as db:
                sql = text("""
                    SELECT * FROM users 
                    WHERE email = :email AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {"email": email, "workspace_id": tenant_id}).mappings().first()
                if not res:
                    return None
                return self._row_to_user(res)
        return await anyio.to_thread.run_sync(_get)

    async def get_by_email_global(self, email: str) -> Optional[User]:
        """Retrieve user by email globally across all tenants (e.g. for login workspace resolution)."""
        def _get():
            with get_db() as db:
                sql = text("""
                    SELECT * FROM users 
                    WHERE email = :email AND deleted_at IS NULL
                """)
                res = db.execute(sql, {"email": email}).mappings().first()
                if not res:
                    return None
                return self._row_to_user(res)
        return await anyio.to_thread.run_sync(_get)

    async def get_all(
        self,
        tenant_id: str,
        filters: Optional[dict[str, Any]] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> list[User]:
        """Retrieve paginated list of users for a tenant."""
        def _get_all():
            with get_db() as db:
                query_str = "SELECT * FROM users WHERE workspace_id = :workspace_id AND deleted_at IS NULL"
                params = {"workspace_id": tenant_id, "limit": limit, "offset": skip}

                if filters:
                    if "role" in filters:
                        db_role_prefix = f"role_{filters['role']}_001%"
                        query_str += " AND role_id LIKE :role_prefix"
                        params["role_prefix"] = db_role_prefix
                    if "is_active" in filters:
                        db_status = "active" if filters["is_active"] else "inactive"
                        query_str += " AND status = :status"
                        params["status"] = db_status

                query_str += " LIMIT :limit OFFSET :offset"
                sql = text(query_str)
                rows = db.execute(sql, params).mappings().all()
                return [self._row_to_user(r) for r in rows]
        return await anyio.to_thread.run_sync(_get_all)

    async def create(self, entity: User) -> User:
        """Persist a new user."""
        def _create():
            with get_db() as db:
                sql = text("""
                    INSERT INTO users (user_id, workspace_id, role_id, full_name, email, phone, password_hash, avatar_url, status)
                    VALUES (:user_id, :workspace_id, :role_id, :full_name, :email, :phone, :password_hash, :avatar_url, :status)
                """)
                db_status = "active" if entity.is_active else "inactive"
                db_role_id = self._role_to_role_id(entity.role, entity.tenant_id)
                db.execute(sql, {
                    "user_id": entity.id,
                    "workspace_id": entity.tenant_id,
                    "role_id": db_role_id,
                    "full_name": entity.full_name,
                    "email": entity.email,
                    "phone": entity.phone,
                    "password_hash": entity.hashed_password,
                    "avatar_url": entity.avatar_url,
                    "status": db_status
                })
                return entity
        return await anyio.to_thread.run_sync(_create)

    async def update(self, entity_id: str, tenant_id: str, data: dict[str, Any]) -> Optional[User]:
        """Update an existing user by ID."""
        def _update():
            with get_db() as db:
                fetch_sql = text("SELECT * FROM users WHERE user_id = :user_id AND workspace_id = :workspace_id AND deleted_at IS NULL")
                existing = db.execute(fetch_sql, {"user_id": entity_id, "workspace_id": tenant_id}).mappings().first()
                if not existing:
                    return None

                update_fields = []
                update_params = {"user_id": entity_id, "workspace_id": tenant_id}

                field_mapping = {
                    "email": "email",
                    "full_name": "full_name",
                    "phone": "phone",
                    "avatar_url": "avatar_url",
                    "hashed_password": "password_hash"
                }

                for k, v in data.items():
                    if k in field_mapping:
                        update_fields.append(f"{field_mapping[k]} = :{k}")
                        update_params[k] = v
                    elif k == "role":
                        db_role_id = self._role_to_role_id(v, tenant_id)
                        update_fields.append("role_id = :role_id")
                        update_params["role_id"] = db_role_id
                    elif k == "is_active":
                        db_status = "active" if v else "inactive"
                        update_fields.append("status = :status")
                        update_params["status"] = db_status

                if not update_fields:
                    return self._row_to_user(existing)

                update_query = f"UPDATE users SET {', '.join(update_fields)} WHERE user_id = :user_id AND workspace_id = :workspace_id"
                db.execute(text(update_query), update_params)

                updated = db.execute(fetch_sql, {"user_id": entity_id, "workspace_id": tenant_id}).mappings().first()
                return self._row_to_user(updated)
        return await anyio.to_thread.run_sync(_update)

    async def delete(self, entity_id: str, tenant_id: str) -> bool:
        """Soft delete a user by ID."""
        def _delete():
            with get_db() as db:
                sql = text("""
                    UPDATE users 
                    SET deleted_at = CURRENT_TIMESTAMP 
                    WHERE user_id = :user_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {"user_id": entity_id, "workspace_id": tenant_id})
                return res.rowcount > 0
        return await anyio.to_thread.run_sync(_delete)

    async def count(self, tenant_id: str, filters: Optional[dict[str, Any]] = None) -> int:
        """Count users matching filters."""
        def _count():
            with get_db() as db:
                query_str = "SELECT COUNT(*) FROM users WHERE workspace_id = :workspace_id AND deleted_at IS NULL"
                params = {"workspace_id": tenant_id}

                if filters:
                    if "role" in filters:
                        db_role_prefix = f"role_{filters['role']}_001%"
                        query_str += " AND role_id LIKE :role_prefix"
                        params["role_prefix"] = db_role_prefix
                    if "is_active" in filters:
                        db_status = "active" if filters["is_active"] else "inactive"
                        query_str += " AND status = :status"
                        params["status"] = db_status

                sql = text(query_str)
                return db.execute(sql, params).scalar()
        return await anyio.to_thread.run_sync(_count)


# Singleton instance
_user_repo = UserRepository()


def get_user_repository() -> UserRepository:
    """Return the singleton UserRepository."""
    return _user_repo
