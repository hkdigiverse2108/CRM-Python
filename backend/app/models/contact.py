"""
Contact Domain Model
=====================
Represents a CRM contact (customer, vendor, or business relation).
"""

from dataclasses import dataclass, field
from datetime import datetime, date, timezone
from typing import Optional, List, Any
import json
import uuid


@dataclass
class Contact:
    """CRM contact entity."""

    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str = ""
    name: str = ""
    company: Optional[str] = None
    role: Optional[str] = None  # maps to designation
    department: Optional[str] = None
    phone: Optional[str] = None
    alt_phone: Optional[str] = None
    email: Optional[str] = None
    whatsapp: Optional[str] = None
    website: Optional[str] = None
    address1: Optional[str] = None
    address2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: str = "India"
    postal_code: Optional[str] = None
    birthday: Optional[date] = None
    anniversary: Optional[date] = None
    notes: Optional[str] = None
    tags: List[str] = field(default_factory=list)
    contact_type: str = "customer"  # customer | vendor | partner | other
    is_active: bool = True
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "name": self.name,
            "company": self.company,
            "role": self.role,
            "department": self.department,
            "phone": self.phone,
            "altPhone": self.alt_phone,
            "email": self.email,
            "whatsapp": self.whatsapp,
            "website": self.website,
            "address1": self.address1,
            "address2": self.address2,
            "city": self.city,
            "state": self.state,
            "country": self.country,
            "postalCode": self.postal_code,
            "birthday": self.birthday.isoformat() if isinstance(self.birthday, (date, datetime)) else self.birthday,
            "anniversary": self.anniversary.isoformat() if isinstance(self.anniversary, (date, datetime)) else self.anniversary,
            "notes": self.notes,
            "tags": self.tags,
            "contact_type": self.contact_type,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at,
            "updated_at": self.updated_at.isoformat() if isinstance(self.updated_at, datetime) else self.updated_at,
        }
