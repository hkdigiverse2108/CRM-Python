import uuid
from datetime import datetime, date, timezone
from typing import Any, Optional
import anyio
from sqlalchemy import text

from backend.app.models.leave import Leave
from backend.app.repositories.base import BaseRepository
from backend.app.core.database import get_db


class LeaveRepository(BaseRepository[Leave]):
    """
    MySQL database repository for HRMS Leave requests.
    Filters all queries by workspace_id.
    """

    def _row_to_leave(self, row: dict[str, Any]) -> Leave:
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

        start_date = row["start_date"]
        if isinstance(start_date, str):
            start_date = date.fromisoformat(start_date)

        end_date = row["end_date"]
        if isinstance(end_date, str):
            end_date = date.fromisoformat(end_date)

        return Leave(
            leave_id=row["leave_id"],
            workspace_id=row["workspace_id"],
            employee_id=row["employee_id"],
            employee_name=row["employee_name"],
            department=row["department"],
            type=row["type"],
            start_date=start_date,
            end_date=end_date,
            days=int(row["days"]),
            reason=row.get("reason"),
            status=row.get("status") or "Pending",
            day_type=row.get("day_type") or "Full Day",
            approved_by=row.get("approved_by"),
            proof_of_leave=row.get("proof_of_leave"),
            created_at=created_at or datetime.now(timezone.utc),
            updated_at=updated_at or datetime.now(timezone.utc),
        )

    async def get_by_id(self, entity_id: str, tenant_id: str) -> Optional[Leave]:
        def _get():
            with get_db() as db:
                sql = text("""
                    SELECT * FROM hrms_leaves 
                    WHERE leave_id = :leave_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {"leave_id": entity_id, "workspace_id": tenant_id}).mappings().first()
                if not res:
                    return None
                return self._row_to_leave(res)
        return await anyio.to_thread.run_sync(_get)

    async def get_all(
        self, tenant_id: str, filters: Optional[dict[str, Any]] = None,
        skip: int = 0, limit: int = 100,
    ) -> list[Leave]:
        def _get_all():
            with get_db() as db:
                query_str = """
                    SELECT * FROM hrms_leaves 
                    WHERE workspace_id = :workspace_id AND deleted_at IS NULL
                """
                params = {"workspace_id": tenant_id}
                if filters:
                    if "employeeId" in filters:
                        query_str += " AND employee_id = :employeeId"
                        params["employeeId"] = filters["employeeId"]
                    if "status" in filters:
                        query_str += " AND status = :status"
                        params["status"] = filters["status"]
                    if "type" in filters:
                        query_str += " AND type = :type"
                        params["type"] = filters["type"]

                query_str += " ORDER BY created_at DESC LIMIT :limit OFFSET :skip"
                params["limit"] = limit
                params["skip"] = skip

                res = db.execute(text(query_str), params).mappings().all()
                return [self._row_to_leave(r) for r in res]
        return await anyio.to_thread.run_sync(_get_all)

    async def create(self, entity: Leave) -> Leave:
        def _create():
            with get_db() as db:
                sql = text("""
                    INSERT INTO hrms_leaves (
                        leave_id, workspace_id, employee_id, employee_name, department,
                        type, start_date, end_date, days, reason, status,
                        day_type, approved_by, proof_of_leave,
                        created_at, updated_at
                    ) VALUES (
                        :leave_id, :workspace_id, :employee_id, :employee_name, :department,
                        :type, :start_date, :end_date, :days, :reason, :status,
                        :day_type, :approved_by, :proof_of_leave,
                        :created_at, :updated_at
                    )
                """)
                db.execute(sql, {
                    "leave_id": entity.leave_id,
                    "workspace_id": entity.workspace_id,
                    "employee_id": entity.employee_id,
                    "employee_name": entity.employee_name,
                    "department": entity.department,
                    "type": entity.type,
                    "start_date": entity.start_date,
                    "end_date": entity.end_date,
                    "days": entity.days,
                    "reason": entity.reason,
                    "status": entity.status,
                    "day_type": entity.day_type,
                    "approved_by": entity.approved_by,
                    "proof_of_leave": entity.proof_of_leave,
                    "created_at": entity.created_at,
                    "updated_at": entity.updated_at,
                })
                db.commit()
                return entity
        return await anyio.to_thread.run_sync(_create)

    async def update(self, entity_id: str, tenant_id: str, data: dict[str, Any]) -> Optional[Leave]:
        def _update():
            with get_db() as db:
                set_clauses = []
                params = {"leave_id": entity_id, "workspace_id": tenant_id}

                field_map = {
                    "status": "status",
                    "reason": "reason",
                    "type": "type",
                    "startDate": "start_date",
                    "endDate": "end_date",
                    "days": "days",
                    "dayType": "day_type",
                    "approvedBy": "approved_by",
                    "proofOfLeave": "proof_of_leave",
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
                    UPDATE hrms_leaves 
                    SET {", ".join(set_clauses)}
                    WHERE leave_id = :leave_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, params)
                db.commit()

                if res.rowcount == 0:
                    return None

        await anyio.to_thread.run_sync(_update)
        return await self.get_by_id(entity_id, tenant_id)

    async def delete(self, entity_id: str, tenant_id: str) -> bool:
        def _delete():
            with get_db() as db:
                sql = text("""
                    UPDATE hrms_leaves 
                    SET deleted_at = :deleted_at 
                    WHERE leave_id = :leave_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {
                    "leave_id": entity_id,
                    "workspace_id": tenant_id,
                    "deleted_at": datetime.now(timezone.utc),
                })
                db.commit()
                return res.rowcount > 0
        return await anyio.to_thread.run_sync(_delete)

    async def count(self, tenant_id: str, filters: Optional[dict[str, Any]] = None) -> int:
        def _count():
            with get_db() as db:
                query_str = "SELECT COUNT(*) FROM hrms_leaves WHERE workspace_id = :workspace_id AND deleted_at IS NULL"
                params = {"workspace_id": tenant_id}
                if filters:
                    if "employeeId" in filters:
                        query_str += " AND employee_id = :employeeId"
                        params["employeeId"] = filters["employeeId"]
                res = db.execute(text(query_str), params).scalar()
                return res or 0
        return await anyio.to_thread.run_sync(_count)


_leave_repo = LeaveRepository()

def get_leave_repository() -> LeaveRepository:
    return _leave_repo
