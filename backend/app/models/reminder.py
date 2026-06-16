from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional
import uuid


@dataclass
class Reminder:
    """Follow-up Reminder Entity."""

    reminder_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    workspace_id: str = ""
    description: str = ""
    type: str = "Call"
    time: str = ""  # string in format "YYYY-MM-DD HH:MM"
    priority: str = "Medium"
    linked_to: str = "Vikram Patel"
    completed: bool = False
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.reminder_id,
            "tenantId": self.workspace_id,
            "desc": self.description,
            "type": self.type,
            "time": self.time,
            "priority": self.priority,
            "linkedTo": self.linked_to,
            "completed": self.completed,
            "createdAt": self.created_at.isoformat() if self.created_at else "",
            "updatedAt": self.updated_at.isoformat() if self.updated_at else "",
        }
