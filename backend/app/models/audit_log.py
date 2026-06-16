from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional
import uuid


@dataclass
class AuditLog:
    """System Audit Log Entity to track user modifications."""
    log_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    workspace_id: str = ""
    user_id: str = ""
    user_email: str = ""
    action: str = ""
    module: Optional[str] = None
    record_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.log_id,
            "tenantId": self.workspace_id,
            "userId": self.user_id,
            "userEmail": self.user_email,
            "action": self.action,
            "module": self.module,
            "recordId": self.record_id,
            "details": self.details,
            "ipAddress": self.ip_address,
            "createdAt": self.created_at.isoformat() if self.created_at else ""
        }
