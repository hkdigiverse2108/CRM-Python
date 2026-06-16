"""
Client Repository
==================
Concrete MySQL database implementation of client data access.
"""

import uuid
import json
from datetime import datetime, timezone
from typing import Any, Optional
import anyio
from sqlalchemy import text

from backend.app.models.client import Client
from backend.app.repositories.base import BaseRepository
from backend.app.core.database import get_db


class ClientRepository(BaseRepository[Client]):
    """
    MySQL database repository for CRM clients.
    """

    def _row_to_client(self, row: dict[str, Any]) -> Client:
        """Helper to construct a Client domain model from a database row."""
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

        def parse_json(col_val):
            if not col_val:
                return []
            try:
                return json.loads(col_val) if isinstance(col_val, str) else col_val
            except Exception:
                return []

        return Client(
            id=row["client_id"],
            tenant_id=row["workspace_id"],
            name=row["name"],
            industry=row.get("industry"),
            business_type=row.get("business_type"),
            gst_number=row.get("gst_number"),
            pan_number=row.get("pan_number"),
            website=row.get("website"),
            email=row.get("email"),
            phone=row.get("phone"),
            alt_phone=row.get("alt_phone"),
            address=row.get("address"),
            city=row.get("city"),
            state=row.get("state"),
            country=row.get("country") or "India",
            postal_code=row.get("postal_code"),
            annual_revenue=float(row.get("annual_revenue") or 0.0),
            employees_count=int(row.get("employees_count") or 0),
            company_size=row.get("company_size") or "1-10",
            owner_name=row.get("owner_name"),
            account_manager=row.get("account_manager"),
            notes=row.get("notes"),
            status=row.get("status") or "Active",
            projects=parse_json(row.get("projects")),
            activities=parse_json(row.get("activities")),
            files=parse_json(row.get("files")),
            tasks=parse_json(row.get("tasks")),
            created_at=created_at or datetime.now(timezone.utc),
            updated_at=updated_at or datetime.now(timezone.utc),
        )

    async def get_by_id(self, entity_id: str, tenant_id: str) -> Optional[Client]:
        """Retrieve a client by ID, filtered by workspace_id."""
        def _get():
            with get_db() as db:
                sql = text("""
                    SELECT * FROM clients 
                    WHERE client_id = :client_id AND workspace_id = :workspace_id
                """)
                res = db.execute(sql, {"client_id": entity_id, "workspace_id": tenant_id}).mappings().first()
                if not res:
                    return None
                return self._row_to_client(res)
        return await anyio.to_thread.run_sync(_get)

    async def get_all(
        self, tenant_id: str, filters: Optional[dict[str, Any]] = None,
        skip: int = 0, limit: int = 100,
    ) -> list[Client]:
        """Retrieve paginated clients filtered by workspace_id and optional filters."""
        def _get_all():
            with get_db() as db:
                query_str = """
                    SELECT * FROM clients 
                    WHERE workspace_id = :workspace_id
                """
                params = {"workspace_id": tenant_id}

                if filters:
                    if "status" in filters:
                        query_str += " AND status = :status"
                        params["status"] = filters["status"]
                    if "industry" in filters:
                        query_str += " AND industry = :industry"
                        params["industry"] = filters["industry"]
                    if "search" in filters and filters["search"]:
                        search_term = filters["search"].strip()[:100]
                        if search_term:
                            query_str += " AND MATCH(name, email, phone, industry, owner_name) AGAINST(:search IN NATURAL LANGUAGE MODE)"
                            params["search"] = search_term

                query_str += " ORDER BY created_at DESC LIMIT :limit OFFSET :skip"
                params["limit"] = limit
                params["skip"] = skip

                res = db.execute(text(query_str), params).mappings().all()
                return [self._row_to_client(r) for r in res]
        return await anyio.to_thread.run_sync(_get_all)

    async def create(self, entity: Client) -> Client:
        """Create a new client in the database."""
        def _create():
            with get_db() as db:
                sql = text("""
                    INSERT INTO clients (
                        client_id, workspace_id, name, industry, business_type, gst_number,
                        pan_number, website, email, phone, alt_phone, address, city, state,
                        country, postal_code, annual_revenue, employees_count, company_size,
                        owner_name, account_manager, notes, status, projects, activities,
                        files, tasks, created_at, updated_at
                    ) VALUES (
                        :client_id, :workspace_id, :name, :industry, :business_type, :gst_number,
                        :pan_number, :website, :email, :phone, :alt_phone, :address, :city, :state,
                        :country, :postal_code, :annual_revenue, :employees_count, :company_size,
                        :owner_name, :account_manager, :notes, :status, :projects, :activities,
                        :files, :tasks, :created_at, :updated_at
                    )
                """)
                db.execute(sql, {
                    "client_id": entity.id,
                    "workspace_id": entity.tenant_id,
                    "name": entity.name,
                    "industry": entity.industry,
                    "business_type": entity.business_type,
                    "gst_number": entity.gst_number,
                    "pan_number": entity.pan_number,
                    "website": entity.website,
                    "email": entity.email,
                    "phone": entity.phone,
                    "alt_phone": entity.alt_phone,
                    "address": entity.address,
                    "city": entity.city,
                    "state": entity.state,
                    "country": entity.country,
                    "postal_code": entity.postal_code,
                    "annual_revenue": entity.annual_revenue,
                    "employees_count": entity.employees_count,
                    "company_size": entity.company_size,
                    "owner_name": entity.owner_name,
                    "account_manager": entity.account_manager,
                    "notes": entity.notes,
                    "status": entity.status,
                    "projects": json.dumps(entity.projects),
                    "activities": json.dumps(entity.activities),
                    "files": json.dumps(entity.files),
                    "tasks": json.dumps(entity.tasks),
                    "created_at": entity.created_at,
                    "updated_at": entity.updated_at
                })
                db.commit()
                return entity
        return await anyio.to_thread.run_sync(_create)

    async def update(self, entity_id: str, tenant_id: str, data: dict[str, Any]) -> Optional[Client]:
        """Update an existing client in the database."""
        def _update():
            with get_db() as db:
                set_clauses = []
                params = {"client_id": entity_id, "workspace_id": tenant_id}

                # Map frontend properties to SQL columns
                field_map = {
                    "name": "name",
                    "industry": "industry",
                    "businessType": "business_type",
                    "gstNumber": "gst_number",
                    "panNumber": "pan_number",
                    "website": "website",
                    "email": "email",
                    "phone": "phone",
                    "altPhone": "alt_phone",
                    "address": "address",
                    "city": "city",
                    "state": "state",
                    "country": "country",
                    "postalCode": "postal_code",
                    "annualRevenue": "annual_revenue",
                    "employeesCount": "employees_count",
                    "companySize": "company_size",
                    "ownerName": "owner_name",
                    "accountManager": "account_manager",
                    "notes": "notes",
                    "status": "status",
                    "projects": "projects",
                    "activities": "activities",
                    "files": "files",
                    "tasks": "tasks"
                }

                for key, val in data.items():
                    db_col = field_map.get(key, key)
                    if db_col in field_map.values():
                        set_clauses.append(f"{db_col} = :{db_col}")
                        if db_col in ("projects", "activities", "files", "tasks"):
                            params[db_col] = json.dumps(val) if val is not None else None
                        else:
                            params[db_col] = val

                if not set_clauses:
                    return None

                set_clauses.append("updated_at = :updated_at")
                params["updated_at"] = datetime.now(timezone.utc)

                sql = text(f"""
                    UPDATE clients 
                    SET {", ".join(set_clauses)}
                    WHERE client_id = :client_id AND workspace_id = :workspace_id
                """)
                res = db.execute(sql, params)
                db.commit()

                if res.rowcount == 0:
                    return None

        await anyio.to_thread.run_sync(_update)
        return await self.get_by_id(entity_id, tenant_id)

    async def delete(self, entity_id: str, tenant_id: str) -> bool:
        """Delete a client from the database."""
        def _delete():
            with get_db() as db:
                sql = text("""
                    DELETE FROM clients 
                    WHERE client_id = :client_id AND workspace_id = :workspace_id
                """)
                res = db.execute(sql, {"client_id": entity_id, "workspace_id": tenant_id})
                db.commit()
                return res.rowcount > 0
        return await anyio.to_thread.run_sync(_delete)

    async def count(self, tenant_id: str, filters: Optional[dict[str, Any]] = None) -> int:
        """Count clients matching tenant_id and filters."""
        def _count():
            with get_db() as db:
                query_str = "SELECT COUNT(*) FROM clients WHERE workspace_id = :workspace_id"
                params = {"workspace_id": tenant_id}
                if filters:
                    if "status" in filters:
                        query_str += " AND status = :status"
                        params["status"] = filters["status"]
                res = db.execute(text(query_str), params).scalar()
                return res or 0
        return await anyio.to_thread.run_sync(_count)


_client_repo = ClientRepository()

def get_client_repository() -> ClientRepository:
    return _client_repo
