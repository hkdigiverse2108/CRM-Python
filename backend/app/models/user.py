"""
User Domain Model
==================
Pure Python dataclass representing a user entity.
No ORM bindings — ready for future SQLAlchemy/MongoEngine mapping.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional
import uuid


@dataclass
class User:
    """Core user entity for authentication and identity."""

    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    email: str = ""
    hashed_password: str = ""
    full_name: str = ""
    role: str = "agent"  # super_admin | admin | manager | agent | finance | support
    is_active: bool = True
    tenant_id: str = ""
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        """Serialize to dict (excludes hashed_password for safety)."""
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role,
            "is_active": self.is_active,
            "tenant_id": self.tenant_id,
            "phone": self.phone,
            "avatar_url": self.avatar_url,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
