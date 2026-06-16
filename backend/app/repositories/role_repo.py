import uuid
from datetime import datetime, timezone
from typing import Any, Optional
import anyio
from sqlalchemy import text

from backend.app.models.role import Role, RolePermission
from backend.app.repositories.base import BaseRepository
from backend.app.core.database import get_db


class RoleRepository(BaseRepository[Role]):
    """
    MySQL database repository for Roles and permissions.
    Filters all queries by workspace_id.
    """

    def _row_to_role(self, row: dict[str, Any]) -> Role:
        created_at = row.get("created_at")
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        elif created_at and not created_at.tzinfo:
            created_at = created_at.replace(tzinfo=timezone.utc)

        return Role(
            role_id=row["role_id"],
            workspace_id=row["workspace_id"],
            role_name=row["role_name"],
            description=row.get("description"),
            is_custom=bool(row.get("is_custom", True)),
            created_at=created_at or datetime.now(timezone.utc),
            role_color=row.get("role_color", "#6366f1") or "#6366f1",
            status=row.get("status", "active") or "active",
            created_by=row.get("created_by"),
            pages_permissions=row.get("pages_permissions"),
            buttons_permissions=row.get("buttons_permissions"),
            department_access=row.get("department_access"),
            branch_access=row.get("branch_access"),
            permissions=[]
        )

    def _row_to_permission(self, row: dict[str, Any]) -> RolePermission:
        return RolePermission(
            id=row["id"],
            role_id=row["role_id"],
            module=row["module"],
            can_view=bool(row.get("can_view")),
            can_create=bool(row.get("can_create")),
            can_edit=bool(row.get("can_edit")),
            can_delete=bool(row.get("can_delete")),
            can_export=bool(row.get("can_export")),
            can_import=bool(row.get("can_import")),
            can_approve=bool(row.get("can_approve")),
            can_assign=bool(row.get("can_assign")),
            can_archive=bool(row.get("can_archive")),
            record_scope=row.get("record_scope") or "all"
        )

    async def get_by_id(self, entity_id: str, tenant_id: str) -> Optional[Role]:
        def _get():
            with get_db() as db:
                sql = text("SELECT * FROM roles WHERE role_id = :role_id AND workspace_id = :workspace_id")
                row = db.execute(sql, {"role_id": entity_id, "workspace_id": tenant_id}).mappings().first()
                if not row:
                    return None
                role = self._row_to_role(row)
                
                # Fetch associated permissions
                perm_sql = text("SELECT * FROM role_permissions WHERE role_id = :role_id")
                perm_rows = db.execute(perm_sql, {"role_id": entity_id}).mappings().all()
                role.permissions = [self._row_to_permission(r) for r in perm_rows]
                return role
        return await anyio.to_thread.run_sync(_get)

    async def get_all(
        self, tenant_id: str, filters: Optional[dict[str, Any]] = None,
        skip: int = 0, limit: int = 200
    ) -> list[Role]:
        def _get_all():
            with get_db() as db:
                query_str = "SELECT * FROM roles WHERE workspace_id = :workspace_id"
                params = {"workspace_id": tenant_id}
                if filters and "is_custom" in filters:
                    query_str += " AND is_custom = :is_custom"
                    params["is_custom"] = int(filters["is_custom"])
                
                query_str += " ORDER BY is_custom ASC, role_name ASC LIMIT :limit OFFSET :skip"
                params["limit"] = limit
                params["skip"] = skip

                rows = db.execute(text(query_str), params).mappings().all()
                roles = []
                for row in rows:
                    role = self._row_to_role(row)
                    perm_sql = text("SELECT * FROM role_permissions WHERE role_id = :role_id")
                    perm_rows = db.execute(perm_sql, {"role_id": role.role_id}).mappings().all()
                    role.permissions = [self._row_to_permission(r) for r in perm_rows]
                    roles.append(role)
                return roles
        return await anyio.to_thread.run_sync(_get_all)

    async def create(self, entity: Role) -> Role:
        def _create():
            with get_db() as db:
                sql = text("""
                    INSERT INTO roles (
                        role_id, workspace_id, role_name, description, is_custom, created_at,
                        role_color, status, created_by, pages_permissions, buttons_permissions,
                        department_access, branch_access
                    ) VALUES (
                        :role_id, :workspace_id, :role_name, :description, :is_custom, :created_at,
                        :role_color, :status, :created_by, :pages_permissions, :buttons_permissions,
                        :department_access, :branch_access
                    )
                """)
                db.execute(sql, {
                    "role_id": entity.role_id,
                    "workspace_id": entity.workspace_id,
                    "role_name": entity.role_name,
                    "description": entity.description,
                    "is_custom": int(entity.is_custom),
                    "created_at": entity.created_at,
                    "role_color": entity.role_color,
                    "status": entity.status,
                    "created_by": entity.created_by,
                    "pages_permissions": entity.pages_permissions,
                    "buttons_permissions": entity.buttons_permissions,
                    "department_access": entity.department_access,
                    "branch_access": entity.branch_access
                })

                # Insert permissions
                for p in entity.permissions:
                    if not p.id:
                        p.id = str(uuid.uuid4())
                    p.role_id = entity.role_id
                    p_sql = text("""
                        INSERT INTO role_permissions (
                            id, role_id, module, can_view, can_create, can_edit, can_delete,
                            can_export, can_import, can_approve, can_assign, can_archive, record_scope
                        ) VALUES (
                            :id, :role_id, :module, :can_view, :can_create, :can_edit, :can_delete,
                            :can_export, :can_import, :can_approve, :can_assign, :can_archive, :record_scope
                        )
                    """)
                    db.execute(p_sql, {
                        "id": p.id,
                        "role_id": p.role_id,
                        "module": p.module,
                        "can_view": int(p.can_view),
                        "can_create": int(p.can_create),
                        "can_edit": int(p.can_edit),
                        "can_delete": int(p.can_delete),
                        "can_export": int(p.can_export),
                        "can_import": int(p.can_import),
                        "can_approve": int(p.can_approve),
                        "can_assign": int(p.can_assign),
                        "can_archive": int(p.can_archive),
                        "record_scope": p.record_scope
                    })
                db.commit()
                return entity
        return await anyio.to_thread.run_sync(_create)

    async def update(self, entity_id: str, tenant_id: str, data: dict[str, Any]) -> Optional[Role]:
        def _update():
            with get_db() as db:
                role_fields = []
                role_params = {"role_id": entity_id, "workspace_id": tenant_id}
                
                if "name" in data:
                    role_fields.append("role_name = :role_name")
                    role_params["role_name"] = data["name"]
                if "description" in data:
                    role_fields.append("description = :description")
                    role_params["description"] = data["description"]
                if "roleColor" in data or "role_color" in data:
                    role_fields.append("role_color = :role_color")
                    role_params["role_color"] = data.get("roleColor") or data.get("role_color")
                if "status" in data:
                    role_fields.append("status = :status")
                    role_params["status"] = data["status"]
                if "pagesPermissions" in data or "pages_permissions" in data:
                    role_fields.append("pages_permissions = :pages_permissions")
                    role_params["pages_permissions"] = data.get("pagesPermissions") or data.get("pages_permissions")
                if "buttonsPermissions" in data or "buttons_permissions" in data:
                    role_fields.append("buttons_permissions = :buttons_permissions")
                    role_params["buttons_permissions"] = data.get("buttonsPermissions") or data.get("buttons_permissions")
                if "departmentAccess" in data or "department_access" in data:
                    role_fields.append("department_access = :department_access")
                    role_params["department_access"] = data.get("departmentAccess") or data.get("department_access")
                if "branchAccess" in data or "branch_access" in data:
                    role_fields.append("branch_access = :branch_access")
                    role_params["branch_access"] = data.get("branchAccess") or data.get("branch_access")
                
                if role_fields:
                    role_sql = text(f"UPDATE roles SET {', '.join(role_fields)} WHERE role_id = :role_id AND workspace_id = :workspace_id")
                    db.execute(role_sql, role_params)

                # Update permissions list if provided
                if "permissions" in data:
                    # Clear existing permissions
                    db.execute(text("DELETE FROM role_permissions WHERE role_id = :role_id"), {"role_id": entity_id})
                    
                    # Insert new ones
                    for p_data in data["permissions"]:
                        p_sql = text("""
                            INSERT INTO role_permissions (
                                id, role_id, module, can_view, can_create, can_edit, can_delete,
                                can_export, can_import, can_approve, can_assign, can_archive, record_scope
                            ) VALUES (
                                :id, :role_id, :module, :can_view, :can_create, :can_edit, :can_delete,
                                :can_export, :can_import, :can_approve, :can_assign, :can_archive, :record_scope
                            )
                        """)
                        db.execute(p_sql, {
                            "id": p_data.get("id") or str(uuid.uuid4()),
                            "role_id": entity_id,
                            "module": p_data["module"],
                            "can_view": int(p_data.get("canView", p_data.get("can_view", False))),
                            "can_create": int(p_data.get("canCreate", p_data.get("can_create", False))),
                            "can_edit": int(p_data.get("canEdit", p_data.get("can_edit", False))),
                            "can_delete": int(p_data.get("canDelete", p_data.get("can_delete", False))),
                            "can_export": int(p_data.get("canExport", p_data.get("can_export", False))),
                            "can_import": int(p_data.get("canImport", p_data.get("can_import", False))),
                            "can_approve": int(p_data.get("canApprove", p_data.get("can_approve", False))),
                            "can_assign": int(p_data.get("canAssign", p_data.get("can_assign", False))),
                            "can_archive": int(p_data.get("canArchive", p_data.get("can_archive", False))),
                            "record_scope": p_data.get("recordScope", p_data.get("record_scope", "all"))
                        })
                db.commit()
        await anyio.to_thread.run_sync(_update)
        return await self.get_by_id(entity_id, tenant_id)

    async def delete(self, entity_id: str, tenant_id: str) -> bool:
        def _delete():
            with get_db() as db:
                db.execute(text("DELETE FROM role_permissions WHERE role_id = :role_id"), {"role_id": entity_id})
                sql = text("DELETE FROM roles WHERE role_id = :role_id AND workspace_id = :workspace_id AND is_custom = 1")
                res = db.execute(sql, {"role_id": entity_id, "workspace_id": tenant_id})
                db.commit()
                return res.rowcount > 0
        return await anyio.to_thread.run_sync(_delete)

    async def count(self, tenant_id: str, filters: Optional[dict[str, Any]] = None) -> int:
        def _count():
            with get_db() as db:
                query_str = "SELECT COUNT(*) FROM roles WHERE workspace_id = :workspace_id"
                params = {"workspace_id": tenant_id}
                if filters and "is_custom" in filters:
                    query_str += " AND is_custom = :is_custom"
                    params["is_custom"] = int(filters["is_custom"])
                return db.execute(text(query_str), params).scalar() or 0
        return await anyio.to_thread.run_sync(_count)


_role_repo = RoleRepository()

def get_role_repository() -> RoleRepository:
    return _role_repo
