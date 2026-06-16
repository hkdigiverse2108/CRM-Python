"""
GST Domain Model
================
Represents a GSTR tax return filing record in the Finance & Billing module.
"""

from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from typing import Optional
import uuid


@dataclass
class GstRecord:
    """Finance GST Record entity."""

    id: str = field(default_factory=lambda: f"GST-2026-{str(uuid.uuid4())[:6].upper()}")
    tenant_id: str = ""
    period: str = ""
    collected: float = 0.0
    itc: float = 0.0
    net_due: float = 0.0
    status: str = "Draft"
    filed_on: Optional[date] = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "tenantId": self.tenant_id,
            "period": self.period,
            "collected": self.collected,
            "itc": self.itc,
            "netDue": self.net_due,
            "status": self.status,
            "filedOn": self.filed_on.isoformat() if self.filed_on else "",
            "createdAt": self.created_at.isoformat() if self.created_at else "",
            "updatedAt": self.updated_at.isoformat() if self.updated_at else "",
        }
