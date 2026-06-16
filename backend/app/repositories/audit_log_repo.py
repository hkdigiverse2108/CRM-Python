from typing import Any, Optional
import anyio
from datetime import datetime, timezone
from sqlalchemy import text

from backend.app.models.audit_log import AuditLog
from backend.app.repositories.base import BaseRepository
from backend.app.core.database import get_db


class AuditLogRepository(BaseRepository[AuditLog]):
    """
    MySQL database repository for Audit Logs.
    Filters all queries by workspace_id.
    """

    def _row_to_log(self, row: dict[str, Any]) -> AuditLog:
        created_at = row["created_at"]
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        elif created_at and not created_at.tzinfo:
            created_at = created_at.replace(tzinfo=timezone.utc)

        return AuditLog(
            log_id=row["log_id"],
            workspace_id=row["workspace_id"],
            user_id=row["user_id"],
            user_email=row["user_email"],
            action=row["action"],
            module=row.get("module"),
            record_id=row.get("record_id"),
            details=row.get("details"),
            ip_address=row.get("ip_address"),
            created_at=created_at or datetime.now(timezone.utc)
        )

    async def get_by_id(self, entity_id: str, tenant_id: str) -> Optional[AuditLog]:
        def _get():
            with get_db() as db:
                sql = text("SELECT * FROM audit_logs WHERE log_id = :log_id AND workspace_id = :workspace_id")
                res = db.execute(sql, {"log_id": entity_id, "workspace_id": tenant_id}).mappings().first()
                if not res:
                    return None
                return self._row_to_log(res)
        return await anyio.to_thread.run_sync(_get)

    async def get_all(
        self, tenant_id: str, filters: Optional[dict[str, Any]] = None,
        skip: int = 0, limit: int = 200
    ) -> list[AuditLog]:
        def _get_all():
            with get_db() as db:
                query_str = "SELECT * FROM audit_logs WHERE workspace_id = :workspace_id"
                params = {"workspace_id": tenant_id}
                
                if filters:
                    if "user_email" in filters:
                        query_str += " AND user_email = :user_email"
                        params["user_email"] = filters["user_email"]
                    if "action" in filters:
                        query_str += " AND action = :action"
                        params["action"] = filters["action"]
                    if "module" in filters:
                        query_str += " AND module = :module"
                        params["module"] = filters["module"]

                query_str += " ORDER BY created_at DESC LIMIT :limit OFFSET :skip"
                params["limit"] = limit
                params["skip"] = skip

                res = db.execute(text(query_str), params).mappings().all()
                return [self._row_to_log(r) for r in res]
        return await anyio.to_thread.run_sync(_get_all)

    async def create(self, entity: AuditLog) -> AuditLog:
        def _create():
            with get_db() as db:
                sql = text("""
                    INSERT INTO audit_logs (log_id, workspace_id, user_id, user_email, action, module, record_id, details, ip_address, created_at)
                    VALUES (:log_id, :workspace_id, :user_id, :user_email, :action, :module, :record_id, :details, :ip_address, :created_at)
                """)
                db.execute(sql, {
                    "log_id": entity.log_id,
                    "workspace_id": entity.workspace_id,
                    "user_id": entity.user_id,
                    "user_email": entity.user_email,
                    "action": entity.action,
                    "module": entity.module,
                    "record_id": entity.record_id,
                    "details": entity.details,
                    "ip_address": entity.ip_address,
                    "created_at": entity.created_at
                })
                db.commit()
                return entity
        return await anyio.to_thread.run_sync(_create)

    async def update(self, entity_id: str, tenant_id: str, data: dict[str, Any]) -> Optional[AuditLog]:
        # Audit Logs are immutable
        return None

    async def delete(self, entity_id: str, tenant_id: str) -> bool:
        # Audit Logs are immutable and cannot be deleted
        return False

    async def count(self, tenant_id: str, filters: Optional[dict[str, Any]] = None) -> int:
        def _count():
            with get_db() as db:
                query_str = "SELECT COUNT(*) FROM audit_logs WHERE workspace_id = :workspace_id"
                params = {"workspace_id": tenant_id}
                if filters:
                    if "user_email" in filters:
                        query_str += " AND user_email = :user_email"
                        params["user_email"] = filters["user_email"]
                    if "action" in filters:
                        query_str += " AND action = :action"
                        params["action"] = filters["action"]
                return db.execute(text(query_str), params).scalar() or 0
        return await anyio.to_thread.run_sync(_count)


_audit_repo = AuditLogRepository()

def get_audit_log_repository() -> AuditLogRepository:
    return _audit_repo
