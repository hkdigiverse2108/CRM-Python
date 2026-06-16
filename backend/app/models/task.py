from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from typing import Optional
import uuid


@dataclass
class Task:
    """CRM Task Entity."""

    task_id: str = field(default_factory=lambda: f"TSK-{str(uuid.uuid4())[:6].upper()}")
    workspace_id: str = ""
    title: str = ""
    type: str = "Task"
    priority: str = "Medium"
    status: str = "To Do"
    assignee: str = "Arjun Mehta"
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    reminder_date: Optional[date] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    project: str = "General"
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.task_id,
            "tenantId": self.workspace_id,
            "title": self.title,
            "type": self.type,
            "priority": self.priority,
            "status": self.status,
            "assignee": self.assignee,
            "startDate": self.start_date.isoformat() if self.start_date else "",
            "dueDate": self.due_date.isoformat() if self.due_date else "",
            "reminderDate": self.reminder_date.isoformat() if self.reminder_date else "",
            "description": self.description or "",
            "notes": self.notes or "",
            "project": self.project,
            "createdAt": self.created_at.isoformat() if self.created_at else "",
            "updatedAt": self.updated_at.isoformat() if self.updated_at else "",
        }
