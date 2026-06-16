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
        import json
        employee_id = data["employeeId"]
        current_date = date.today()
        action = data.get("action")

        # Try to find existing record for today
        existing = await self.attendance_repo.get_by_employee_and_date(employee_id, current_date, tenant_id)

        # Helper time functions
        def calculate_time_diff_minutes(t1_str: str, t2_str: str) -> int:
            try:
                from datetime import datetime
                t1 = datetime.strptime(t1_str.strip(), "%I:%M %p")
                t2 = datetime.strptime(t2_str.strip(), "%I:%M %p")
                diff = t2 - t1
                seconds = diff.total_seconds()
                if seconds < 0:
                    seconds += 24 * 3600
                return int(seconds // 60)
            except Exception:
                return 0

        def format_minutes(minutes: int) -> str:
            h = minutes // 60
            m = minutes % 60
            return f"{h}h {m}m"

        time_now = data.get("checkIn") or data.get("checkOut") or datetime.now().strftime("%I:%M %p")

        if not existing:
            # Handle first punch-in of the day
            emp_repo = get_employee_repository()
            employee = await emp_repo.get_by_id(employee_id, tenant_id)
            if not employee:
                raise HTTPException(status_code=404, detail="Employee not found")

            att = Attendance(
                workspace_id=tenant_id,
                employee_id=employee_id,
                name=employee.name,
                role=employee.role,
                date=current_date,
                check_in=time_now,
                check_out=None,
                working_hours=0.0,
                break_duration="0h 0m",
                overtime_hours=0.0,
                method="Web Check-In",
                status="Present",
                active=True,
                current_status="punch-in",
                break_history="[]"
            )
            created = await self.attendance_repo.create(att)
            await emp_repo.update(employee_id, tenant_id, {"attendanceStatus": "Present"})
            return created.to_dict()

        # If existing record exists
        if action == "punch-in":
            update_data = {
                "checkIn": time_now,
                "checkOut": None,
                "workingHours": 0.0,
                "active": True,
                "currentStatus": "punch-in",
                "status": "Present"
            }
            updated = await self.attendance_repo.update(existing.attendance_id, tenant_id, update_data)
            emp_repo = get_employee_repository()
            await emp_repo.update(employee_id, tenant_id, {"attendanceStatus": "Present"})
            return updated.to_dict()

        elif action == "break-in":
            # Append a new break record to break_history
            try:
                breaks = json.loads(existing.break_history) if existing.break_history else []
            except Exception:
                breaks = []
            breaks.append({"start": time_now, "end": None})

            update_data = {
                "currentStatus": "break-in",
                "breakHistory": json.dumps(breaks)
            }
            updated = await self.attendance_repo.update(existing.attendance_id, tenant_id, update_data)
            return updated.to_dict()

        elif action == "break-out":
            # Find the active break and set its end time
            try:
                breaks = json.loads(existing.break_history) if existing.break_history else []
            except Exception:
                breaks = []

            if breaks and breaks[-1]["end"] is None:
                breaks[-1]["end"] = time_now

            # Calculate total break duration
            total_break_mins = 0
            for b in breaks:
                if b.get("start") and b.get("end"):
                    total_break_mins += calculate_time_diff_minutes(b["start"], b["end"])

            update_data = {
                "currentStatus": "break-out",
                "breakHistory": json.dumps(breaks),
                "breakDuration": format_minutes(total_break_mins)
            }
            updated = await self.attendance_repo.update(existing.attendance_id, tenant_id, update_data)
            return updated.to_dict()

        elif action == "punch-out" or (not action and not data.get("active", True)):
            # Calculate final production hours (total elapsed - break duration)
            total_elapsed_mins = calculate_time_diff_minutes(existing.check_in, time_now)
            
            # Calculate total break duration
            total_break_mins = 0
            try:
                breaks = json.loads(existing.break_history) if existing.break_history else []
            except Exception:
                breaks = []

            # If currently in break, close it
            if breaks and breaks[-1]["end"] is None:
                breaks[-1]["end"] = time_now
            
            for b in breaks:
                if b.get("start") and b.get("end"):
                    total_break_mins += calculate_time_diff_minutes(b["start"], b["end"])

            production_mins = max(0, total_elapsed_mins - total_break_mins)
            production_hours = round(production_mins / 60.0, 2)
            
            # Overtime is anything over 8 hours
            overtime_hours = max(0.0, round(production_hours - 8.0, 2))

            update_data = {
                "checkOut": time_now,
                "workingHours": production_hours,
                "overtimeHours": overtime_hours,
                "active": False,
                "currentStatus": "punch-out",
                "breakHistory": json.dumps(breaks),
                "breakDuration": format_minutes(total_break_mins)
            }
            updated = await self.attendance_repo.update(existing.attendance_id, tenant_id, update_data)
            return updated.to_dict()

        else:
            # Fallback backward-compatibility support
            is_check_in_req = data.get("active") is True or (data.get("checkIn") is not None and data.get("checkOut") is None)
            if is_check_in_req:
                update_data = {
                    "checkIn": time_now,
                    "checkOut": None,
                    "workingHours": 0.0,
                    "active": True,
                    "currentStatus": "punch-in",
                    "status": "Present",
                }
                updated = await self.attendance_repo.update(existing.attendance_id, tenant_id, update_data)
                return updated.to_dict()
            else:
                total_elapsed_mins = calculate_time_diff_minutes(existing.check_in, time_now)
                production_hours = round(total_elapsed_mins / 60.0, 2)
                update_data = {
                    "checkOut": time_now,
                    "workingHours": production_hours,
                    "active": False,
                    "currentStatus": "punch-out",
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
