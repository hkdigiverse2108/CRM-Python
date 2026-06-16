from typing import Any, Optional, Dict
from datetime import datetime, timezone
import uuid

from backend.app.models.audit_log import AuditLog
from backend.app.repositories.audit_log_repo import AuditLogRepository, get_audit_log_repository


class AuditLogService:
    def __init__(self, audit_repo: AuditLogRepository):
        self.audit_repo = audit_repo

    async def log_action(
        self, workspace_id: str, user_id: str, user_email: str, action: str,
        module: Optional[str] = None, record_id: Optional[str] = None,
        details: Optional[str] = None, ip_address: Optional[str] = None
    ) -> AuditLog:
        log = AuditLog(
            log_id=str(uuid.uuid4()),
            workspace_id=workspace_id,
            user_id=user_id,
            user_email=user_email,
            action=action,
            module=module,
            record_id=record_id,
            details=details,
            ip_address=ip_address,
            created_at=datetime.now(timezone.utc)
        )
        return await self.audit_repo.create(log)

    async def list_logs(
        self, tenant_id: str, filters: Optional[dict[str, Any]] = None, page: int = 1, per_page: int = 50
    ) -> Dict[str, Any]:
        skip = (page - 1) * per_page
        logs = await self.audit_repo.get_all(tenant_id, filters, skip, per_page)
        total = await self.audit_repo.count(tenant_id, filters)
        return {
            "items": [log.to_dict() for log in logs],
            "meta": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": (total + per_page - 1) // per_page if total > 0 else 0,
            },
        }


_audit_service = AuditLogService(get_audit_log_repository())

def get_audit_log_service() -> AuditLogService:
    return _audit_service
