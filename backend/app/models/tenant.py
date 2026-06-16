"""
Tenant Domain Model
====================
Represents a tenant (organization/workspace) in the multi-tenant architecture.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional
import uuid


@dataclass
class Tenant:
    """Tenant entity representing an organization workspace."""

    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str = ""          # Slug identifier (e.g. "rapidmodel_corp")
    name: str = ""               # Display name (e.g. "RapidModel Corp")
    plan: str = "professional"   # starter | professional | enterprise
    is_active: bool = True
    max_users: int = 50
    domain: Optional[str] = None
    logo_url: Optional[str] = None
    features: list[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "name": self.name,
            "plan": self.plan,
            "is_active": self.is_active,
            "max_users": self.max_users,
            "domain": self.domain,
            "features": self.features,
            "created_at": self.created_at.isoformat(),
        }
