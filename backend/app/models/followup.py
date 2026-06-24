"""
Lead Followup Domain Model
==========================
Represents a logged followup call, message, or task for a lead.
"""

from dataclasses import dataclass, field
from datetime import datetime, date, time
from typing import Optional
import uuid


@dataclass
class LeadFollowup:
    """Lead followup log entry."""

    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    workspace_id: str = ""
    lead_id: str = ""
    followup_date: date = field(default_factory=lambda: datetime.utcnow().date())
    followup_time: Optional[time] = None
    followup_type: str = "Call"  # Call | WhatsApp | Email | F2F Meeting
    remarks: str = ""
    status: str = "Completed"  # Completed | Pending
    created_by: Optional[str] = None
    created_at: datetime = field(default_factory=lambda: datetime.utcnow())

    # Fields to support scheduling next followup
    next_followup_date: Optional[date] = None
    next_followup_remarks: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "workspace_id": self.workspace_id,
            "lead_id": self.lead_id,
            "followup_date": self.followup_date.isoformat() if self.followup_date else None,
            "followup_time": self.followup_time.isoformat() if self.followup_time else None,
            "followup_type": self.followup_type,
            "remarks": self.remarks,
            "status": self.status,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "next_followup_date": self.next_followup_date.isoformat() if self.next_followup_date else None,
            "next_followup_remarks": self.next_followup_remarks,
        }
