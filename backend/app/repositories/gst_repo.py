"""
GST Repository
==============
Row-level isolation repository for managing GST records.
"""

from datetime import datetime, timezone, date
from typing import Any, Optional
import anyio
from sqlalchemy import text

from backend.app.models.gst import GstRecord
from backend.app.repositories.base import BaseRepository
from backend.app.core.database import get_db


class GstRepository(BaseRepository[GstRecord]):
    """MySQL database repository for Finance GST Records."""

    def _row_to_record(self, row: dict[str, Any]) -> GstRecord:
        """Helper to construct a GstRecord domain model from a database row."""
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

        filed_on = row["filed_on"]
        if isinstance(filed_on, str):
            filed_on = date.fromisoformat(filed_on)

        return GstRecord(
            id=row["record_id"],
            tenant_id=row["workspace_id"],
            period=row["period"],
            collected=float(row.get("collected") or 0.0),
            itc=float(row.get("itc") or 0.0),
            net_due=float(row.get("net_due") or 0.0),
            status=row.get("status") or "Draft",
            filed_on=filed_on,
            created_at=created_at or datetime.now(timezone.utc),
            updated_at=updated_at or datetime.now(timezone.utc),
        )

    async def get_by_id(self, entity_id: str, tenant_id: str) -> Optional[GstRecord]:
        """Retrieve a GST record by ID, filtered by workspace_id."""
        def _get():
            with get_db() as db:
                sql = text("""
                    SELECT * FROM finance_gst_records 
                    WHERE record_id = :record_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {"record_id": entity_id, "workspace_id": tenant_id}).mappings().first()
                if not res:
                    return None
                return self._row_to_record(res)
        return await anyio.to_thread.run_sync(_get)

    async def get_all(
        self, tenant_id: str, filters: Optional[dict[str, Any]] = None,
        skip: int = 0, limit: int = 100,
    ) -> list[GstRecord]:
        """Retrieve paginated GST records filtered by workspace_id and optional filters."""
        def _get_all():
            with get_db() as db:
                query_str = """
                    SELECT * FROM finance_gst_records 
                    WHERE workspace_id = :workspace_id AND deleted_at IS NULL
                """
                params = {"workspace_id": tenant_id}
                if filters:
                    if "status" in filters and filters["status"]:
                        query_str += " AND status = :status"
                        params["status"] = filters["status"]
                    if "search" in filters and filters["search"]:
                        query_str += " AND period LIKE :search"
                        params["search"] = f"%{filters['search']}%"

                query_str += " ORDER BY created_at DESC LIMIT :limit OFFSET :skip"
                params["limit"] = limit
                params["skip"] = skip

                res = db.execute(text(query_str), params).mappings().all()
                return [self._row_to_record(r) for r in res]
        return await anyio.to_thread.run_sync(_get_all)

    async def create(self, entity: GstRecord) -> GstRecord:
        """Create a new GST record."""
        def _create():
            with get_db() as db:
                sql = text("""
                    INSERT INTO finance_gst_records (
                        record_id, workspace_id, period, collected, itc, net_due,
                        status, filed_on, created_at, updated_at
                    ) VALUES (
                        :record_id, :workspace_id, :period, :collected, :itc, :net_due,
                        :status, :filed_on, :created_at, :updated_at
                    )
                """)
                db.execute(sql, {
                    "record_id": entity.id,
                    "workspace_id": entity.tenant_id,
                    "period": entity.period,
                    "collected": entity.collected,
                    "itc": entity.itc,
                    "net_due": entity.net_due,
                    "status": entity.status,
                    "filed_on": entity.filed_on,
                    "created_at": entity.created_at,
                    "updated_at": entity.updated_at,
                })
                db.commit()
                return entity
        return await anyio.to_thread.run_sync(_create)

    async def update(self, entity_id: str, tenant_id: str, data: dict[str, Any]) -> Optional[GstRecord]:
        """Update a GST record in the database."""
        def _update():
            with get_db() as db:
                set_clauses = []
                params = {"record_id": entity_id, "workspace_id": tenant_id}

                field_map = {
                    "period": "period",
                    "collected": "collected",
                    "itc": "itc",
                    "net_due": "net_due",
                    "status": "status",
                    "filed_on": "filed_on",
                }

                for key, val in data.items():
                    db_col = field_map.get(key, key)
                    if db_col in field_map.values():
                        set_clauses.append(f"{db_col} = :{db_col}")
                        params[db_col] = val

                if not set_clauses:
                    return None

                set_clauses.append("updated_at = :updated_at")
                params["updated_at"] = datetime.now(timezone.utc)

                sql = text(f"""
                    UPDATE finance_gst_records 
                    SET {", ".join(set_clauses)}
                    WHERE record_id = :record_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, params)
                db.commit()

                if res.rowcount == 0:
                    return None

        await anyio.to_thread.run_sync(_update)
        return await self.get_by_id(entity_id, tenant_id)

    async def delete(self, entity_id: str, tenant_id: str) -> bool:
        """Soft-delete a GST record."""
        def _delete():
            with get_db() as db:
                sql = text("""
                    UPDATE finance_gst_records 
                    SET deleted_at = :deleted_at 
                    WHERE record_id = :record_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {
                    "record_id": entity_id,
                    "workspace_id": tenant_id,
                    "deleted_at": datetime.now(timezone.utc),
                })
                db.commit()
                return res.rowcount > 0
        return await anyio.to_thread.run_sync(_delete)

    async def count(self, tenant_id: str, filters: Optional[dict[str, Any]] = None) -> int:
        """Count GST records."""
        def _count():
            with get_db() as db:
                query_str = "SELECT COUNT(*) FROM finance_gst_records WHERE workspace_id = :workspace_id AND deleted_at IS NULL"
                params = {"workspace_id": tenant_id}
                if filters:
                    if "status" in filters and filters["status"]:
                        query_str += " AND status = :status"
                        params["status"] = filters["status"]

                res = db.execute(text(query_str), params).scalar()
                return res or 0
        return await anyio.to_thread.run_sync(_count)


_gst_repo = GstRepository()

def get_gst_repository() -> GstRepository:
    return _gst_repo
