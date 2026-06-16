"""
Lead Domain Model
==================
Represents a sales lead in the CRM pipeline.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional
import uuid


@dataclass
class Lead:
    """CRM lead entity."""

    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    email: str = ""
    phone: Optional[str] = None
    company: Optional[str] = None
    source: str = "website"     # website | whatsapp | meta_ads | referral | cold_call | indiamart | justdial | tradeindia
    status: str = "new"         # new | contacted | qualified | proposal | won | lost
    score: int = 0
    assigned_to: Optional[str] = None
    tenant_id: str = ""
    notes: Optional[str] = None
    value: float = 0.0
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "company": self.company,
            "source": self.source,
            "status": self.status,
            "score": self.score,
            "assigned_to": self.assigned_to,
            "tenant_id": self.tenant_id,
            "notes": self.notes,
            "value": self.value,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
