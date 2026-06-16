from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from typing import Optional
import uuid


@dataclass
class Leave:
    """HRMS Leave Request Entity."""

    leave_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    workspace_id: str = ""
    employee_id: str = ""
    employee_name: str = ""
    department: str = ""
    type: str = ""
    start_date: date = field(default_factory=date.today)
    end_date: date = field(default_factory=date.today)
    days: int = 1
    reason: Optional[str] = None
    status: str = "Pending"
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.leave_id,
            "tenantId": self.workspace_id,
            "employeeId": self.employee_id,
            "employeeName": self.employee_name,
            "department": self.department,
            "type": self.type,
            "startDate": self.start_date.isoformat() if self.start_date else "",
            "endDate": self.end_date.isoformat() if self.end_date else "",
            "days": self.days,
            "reason": self.reason or "",
            "status": self.status,
            "createdAt": self.created_at.isoformat() if self.created_at else "",
            "updatedAt": self.updated_at.isoformat() if self.updated_at else "",
        }
