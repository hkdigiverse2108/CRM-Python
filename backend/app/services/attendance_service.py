from typing import Any, Optional, Dict
from fastapi import HTTPException
from datetime import datetime, date, timezone

from backend.app.models.attendance import Attendance
from backend.app.repositories.attendance_repo import AttendanceRepository, get_attendance_repository
from backend.app.repositories.employee_repo import get_employee_repository


class AttendanceService:
    def __init__(self, attendance_repo: AttendanceRepository):
        self.attendance_repo = attendance_repo

    async def get_attendance(self, attendance_id: str, tenant_id: str) -> Dict[str, Any]:
        att = await self.attendance_repo.get_by_id(attendance_id, tenant_id)
        if not att:
            raise HTTPException(status_code=404, detail="Attendance record not found")
        return att.to_dict()

    async def list_attendance(
        self, tenant_id: str, filters: Optional[dict[str, Any]] = None, page: int = 1, per_page: int = 100
    ) -> Dict[str, Any]:
        skip = (page - 1) * per_page
        records = await self.attendance_repo.get_all(tenant_id, filters, skip, per_page)
        total = await self.attendance_repo.count(tenant_id, filters)
        return {
            "items": [rec.to_dict() for rec in records],
            "meta": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": (total + per_page - 1) // per_page if total > 0 else 0,
            },
        }

    async def clock_in_out(self, data: dict[str, Any], tenant_id: str) -> Dict[str, Any]:
        employee_id = data["employeeId"]
        current_date = date.today()

        # Try to find existing record for today
        existing = await self.attendance_repo.get_by_employee_and_date(employee_id, current_date, tenant_id)

        if not existing:
            # Clock In
            emp_repo = get_employee_repository()
            employee = await emp_repo.get_by_id(employee_id, tenant_id)
            if not employee:
                raise HTTPException(status_code=404, detail="Employee not found")

            check_in_time = data.get("checkIn") or datetime.now().strftime("%I:%M %p")
            att = Attendance(
                workspace_id=tenant_id,
                employee_id=employee_id,
                name=employee.name,
                role=employee.role,
                date=current_date,
                check_in=check_in_time,
                check_out=None,
                working_hours=0.0,
                break_duration="0.5 hrs",
                overtime_hours=0.0,
                method="Web Check-In",
                status="Present",
                active=True,
            )
            created = await self.attendance_repo.create(att)
            # Update employee attendance status
            await emp_repo.update(employee_id, tenant_id, {"attendanceStatus": "Present"})
            return created.to_dict()
        else:
            # Clock Out
            check_out_time = data.get("checkOut") or datetime.now().strftime("%I:%M %p")
            
            # Calculate working hours if check_in exists
            hours = 8.0
            if existing.check_in:
                try:
                    fmt = "%I:%M %p"
                    t1 = datetime.strptime(existing.check_in, fmt)
                    t2 = datetime.strptime(check_out_time, fmt)
                    diff = t2 - t1
                    hours = max(0.0, round(diff.total_seconds() / 3600.0, 2))
                except Exception:
                    pass

            update_data = {
                "checkOut": check_out_time,
                "workingHours": hours,
                "active": False,
                "status": "Present",
            }
            updated = await self.attendance_repo.update(existing.attendance_id, tenant_id, update_data)
            return updated.to_dict()

    async def manual_attendance(self, data: dict[str, Any], tenant_id: str) -> Dict[str, Any]:
        employee_id = data["employeeId"]
        att_date = data["date"]
        if isinstance(att_date, str):
            att_date = date.fromisoformat(att_date)

        # Check if record already exists for this date
        existing = await self.attendance_repo.get_by_employee_and_date(employee_id, att_date, tenant_id)

        if existing:
            # Update existing manual correction
            updated = await self.attendance_repo.update(existing.attendance_id, tenant_id, data)
            return updated.to_dict()
        else:
            # Create new record
            emp_repo = get_employee_repository()
            employee = await emp_repo.get_by_id(employee_id, tenant_id)
            if not employee:
                raise HTTPException(status_code=404, detail="Employee not found")

            att = Attendance(
                workspace_id=tenant_id,
                employee_id=employee_id,
                name=employee.name,
                role=employee.role,
                date=att_date,
                check_in=data.get("checkIn"),
                check_out=data.get("checkOut"),
                working_hours=float(data.get("workingHours") or 0.0),
                break_duration=data.get("breakDuration") or "0.5 hrs",
                overtime_hours=float(data.get("overtimeHours") or 0.0),
                method=data.get("method") or "Manual Entry",
                status=data.get("status") or "Present",
                active=False,
            )
            created = await self.attendance_repo.create(att)
            return created.to_dict()

    async def update_attendance(self, attendance_id: str, tenant_id: str, data: dict[str, Any]) -> Dict[str, Any]:
        att = await self.attendance_repo.get_by_id(attendance_id, tenant_id)
        if not att:
            raise HTTPException(status_code=404, detail="Attendance record not found")
        updated = await self.attendance_repo.update(attendance_id, tenant_id, data)
        return updated.to_dict()

    async def delete_attendance(self, attendance_id: str, tenant_id: str) -> None:
        att = await self.attendance_repo.get_by_id(attendance_id, tenant_id)
        if not att:
            raise HTTPException(status_code=404, detail="Attendance record not found")
        await self.attendance_repo.delete(attendance_id, tenant_id)


_attendance_service = AttendanceService(get_attendance_repository())

def get_attendance_service() -> AttendanceService:
    return _attendance_service
