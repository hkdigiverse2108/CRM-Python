"""
Client Domain Model
===================
Represents a CRM client account, storing business info, project portfolios,
financial history, and activity logs.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
import uuid


@dataclass
class Client:
    """CRM client account entity."""

    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str = ""
    name: str = ""
    industry: Optional[str] = None
    business_type: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    website: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    alt_phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: str = "India"
    postal_code: Optional[str] = None
    annual_revenue: float = 0.0
    employees_count: int = 0
    company_size: str = "1-10"
    owner_name: Optional[str] = None
    account_manager: Optional[str] = None
    notes: Optional[str] = None
    status: str = "Active"
    projects: List[Dict[str, Any]] = field(default_factory=list)
    activities: List[Dict[str, Any]] = field(default_factory=list)
    files: List[Dict[str, Any]] = field(default_factory=list)
    tasks: List[Dict[str, Any]] = field(default_factory=list)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "name": self.name,
            "industry": self.industry,
            "businessType": self.business_type,
            "gstNumber": self.gst_number,
            "panNumber": self.pan_number,
            "website": self.website,
            "email": self.email,
            "phone": self.phone,
            "altPhone": self.alt_phone,
            "address": self.address,
            "city": self.city,
            "state": self.state,
            "country": self.country,
            "postalCode": self.postal_code,
            "annualRevenue": self.annual_revenue,
            "employeesCount": self.employees_count,
            "companySize": self.company_size,
            "ownerName": self.owner_name,
            "accountManager": self.account_manager,
            "notes": self.notes,
            "status": self.status,
            "projects": self.projects,
            "activities": self.activities,
            "files": self.files,
            "tasks": self.tasks,
            "created_at": self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at,
            "updated_at": self.updated_at.isoformat() if isinstance(self.updated_at, datetime) else self.updated_at,
        }
