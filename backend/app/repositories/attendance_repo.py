import uuid
from datetime import datetime, date, timezone
from typing import Any, Optional
import anyio
from sqlalchemy import text

from backend.app.models.attendance import Attendance
from backend.app.repositories.base import BaseRepository
from backend.app.core.database import get_db


class AttendanceRepository(BaseRepository[Attendance]):
    """
    MySQL database repository for HRMS attendance records.
    Filters all queries by workspace_id.
    """

    def _row_to_attendance(self, row: dict[str, Any]) -> Attendance:
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

        row_date = row["date"]
        if isinstance(row_date, str):
            row_date = date.fromisoformat(row_date)

        return Attendance(
            attendance_id=row["attendance_id"],
            workspace_id=row["workspace_id"],
            employee_id=row["employee_id"],
            name=row["name"],
            role=row["role"],
            date=row_date,
            check_in=row.get("check_in"),
            check_out=row.get("check_out"),
            working_hours=float(row.get("working_hours") or 0.0),
            break_duration=row.get("break_duration"),
            overtime_hours=float(row.get("overtime_hours") or 0.0),
            method=row.get("method") or "Manual Entry",
            status=row.get("status") or "Present",
            active=bool(row.get("active") or False),
            created_at=created_at or datetime.now(timezone.utc),
            updated_at=updated_at or datetime.now(timezone.utc),
        )

    async def get_by_id(self, entity_id: str, tenant_id: str) -> Optional[Attendance]:
        def _get():
            with get_db() as db:
                sql = text("""
                    SELECT * FROM hrms_attendance 
                    WHERE attendance_id = :attendance_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {"attendance_id": entity_id, "workspace_id": tenant_id}).mappings().first()
                if not res:
                    return None
                return self._row_to_attendance(res)
        return await anyio.to_thread.run_sync(_get)

    async def get_by_employee_and_date(self, employee_id: str, attendance_date: date, tenant_id: str) -> Optional[Attendance]:
        def _get():
            with get_db() as db:
                sql = text("""
                    SELECT * FROM hrms_attendance 
                    WHERE employee_id = :employee_id AND date = :date AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {
                    "employee_id": employee_id,
                    "date": attendance_date,
                    "workspace_id": tenant_id
                }).mappings().first()
                if not res:
                    return None
                return self._row_to_attendance(res)
        return await anyio.to_thread.run_sync(_get)

    async def get_all(
        self, tenant_id: str, filters: Optional[dict[str, Any]] = None,
        skip: int = 0, limit: int = 100,
    ) -> list[Attendance]:
        def _get_all():
            with get_db() as db:
                query_str = """
                    SELECT * FROM hrms_attendance 
                    WHERE workspace_id = :workspace_id AND deleted_at IS NULL
                """
                params = {"workspace_id": tenant_id}
                if filters:
                    if "employeeId" in filters:
                        query_str += " AND employee_id = :employeeId"
                        params["employeeId"] = filters["employeeId"]
                    if "date" in filters:
                        query_str += " AND date = :date"
                        params["date"] = filters["date"]
                    if "status" in filters:
                        query_str += " AND status = :status"
                        params["status"] = filters["status"]

                query_str += " ORDER BY date DESC, created_at DESC LIMIT :limit OFFSET :skip"
                params["limit"] = limit
                params["skip"] = skip

                res = db.execute(text(query_str), params).mappings().all()
                return [self._row_to_attendance(r) for r in res]
        return await anyio.to_thread.run_sync(_get_all)

    async def create(self, entity: Attendance) -> Attendance:
        def _create():
            with get_db() as db:
                sql = text("""
                    INSERT INTO hrms_attendance (
                        attendance_id, workspace_id, employee_id, name, role, date,
                        check_in, check_out, working_hours, break_duration, overtime_hours,
                        method, status, active, created_at, updated_at
                    ) VALUES (
                        :attendance_id, :workspace_id, :employee_id, :name, :role, :date,
                        :check_in, :check_out, :working_hours, :break_duration, :overtime_hours,
                        :method, :status, :active, :created_at, :updated_at
                    )
                """)
                db.execute(sql, {
                    "attendance_id": entity.attendance_id,
                    "workspace_id": entity.workspace_id,
                    "employee_id": entity.employee_id,
                    "name": entity.name,
                    "role": entity.role,
                    "date": entity.date,
                    "check_in": entity.check_in,
                    "check_out": entity.check_out,
                    "working_hours": entity.working_hours,
                    "break_duration": entity.break_duration,
                    "overtime_hours": entity.overtime_hours,
                    "method": entity.method,
                    "status": entity.status,
                    "active": int(entity.active),
                    "created_at": entity.created_at,
                    "updated_at": entity.updated_at,
                })
                db.commit()
                return entity
        return await anyio.to_thread.run_sync(_create)

    async def update(self, entity_id: str, tenant_id: str, data: dict[str, Any]) -> Optional[Attendance]:
        def _update():
            with get_db() as db:
                set_clauses = []
                params = {"attendance_id": entity_id, "workspace_id": tenant_id}

                field_map = {
                    "checkIn": "check_in",
                    "checkOut": "check_out",
                    "workingHours": "working_hours",
                    "breakDuration": "break_duration",
                    "overtimeHours": "overtime_hours",
                    "status": "status",
                    "active": "active",
                    "method": "method",
                }

                for key, val in data.items():
                    db_col = field_map.get(key, key)
                    if db_col in field_map.values():
                        set_clauses.append(f"{db_col} = :{db_col}")
                        if db_col == "active":
                            params[db_col] = int(val) if val is not None else 0
                        else:
                            params[db_col] = val

                if not set_clauses:
                    return None

                set_clauses.append("updated_at = :updated_at")
                params["updated_at"] = datetime.now(timezone.utc)

                sql = text(f"""
                    UPDATE hrms_attendance 
                    SET {", ".join(set_clauses)}
                    WHERE attendance_id = :attendance_id AND workspace_id = :workspace_id AND deleted_at IS NULL
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
                    UPDATE hrms_attendance 
                    SET deleted_at = :deleted_at 
                    WHERE attendance_id = :attendance_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {
                    "attendance_id": entity_id,
                    "workspace_id": tenant_id,
                    "deleted_at": datetime.now(timezone.utc),
                })
                db.commit()
                return res.rowcount > 0
        return await anyio.to_thread.run_sync(_delete)

    async def count(self, tenant_id: str, filters: Optional[dict[str, Any]] = None) -> int:
        def _count():
            with get_db() as db:
                query_str = "SELECT COUNT(*) FROM hrms_attendance WHERE workspace_id = :workspace_id AND deleted_at IS NULL"
                params = {"workspace_id": tenant_id}
                if filters:
                    if "employeeId" in filters:
                        query_str += " AND employee_id = :employeeId"
                        params["employeeId"] = filters["employeeId"]
                res = db.execute(text(query_str), params).scalar()
                return res or 0
        return await anyio.to_thread.run_sync(_count)


_attendance_repo = AttendanceRepository()

def get_attendance_repository() -> AttendanceRepository:
    return _attendance_repo
