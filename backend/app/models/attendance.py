from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from typing import Optional
import uuid


@dataclass
class Attendance:
    """HRMS Attendance Entity."""

    attendance_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    workspace_id: str = ""
    employee_id: str = ""
    name: str = ""
    role: str = ""
    date: date = field(default_factory=date.today)
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    working_hours: float = 0.0
    break_duration: Optional[str] = None
    overtime_hours: float = 0.0
    method: str = "Manual Entry"
    status: str = "Present"
    active: bool = False
    current_status: str = "punch-out"
    break_history: Optional[str] = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.attendance_id,
            "tenantId": self.workspace_id,
            "employeeId": self.employee_id,
            "name": self.name,
            "role": self.role,
            "date": self.date.isoformat() if self.date else "",
            "checkIn": self.check_in or "",
            "checkOut": self.check_out or "",
            "workingHours": self.working_hours,
            "breakDuration": self.break_duration or "",
            "overtimeHours": self.overtime_hours,
            "method": self.method,
            "status": self.status,
            "active": self.active,
            "currentStatus": self.current_status,
            "breakHistory": self.break_history or "",
            "createdAt": self.created_at.isoformat() if self.created_at else "",
            "updatedAt": self.updated_at.isoformat() if self.updated_at else "",
        }
