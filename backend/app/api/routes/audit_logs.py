from typing import Optional
from fastapi import APIRouter, Depends, Query, Request

from backend.app.services.audit_log_service import AuditLogService, get_audit_log_service
from backend.app.api.dependencies.auth import get_current_user
from backend.app.utils.response import success_response

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("")
async def list_audit_logs(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    user_email: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    module: Optional[str] = Query(None),
    audit_service: AuditLogService = Depends(get_audit_log_service)
):
    tenant_id = request.state.user["tenant_id"]
    filters = {}
    if user_email:
        filters["user_email"] = user_email
    if action:
        filters["action"] = action
    if module:
        filters["module"] = module

    result = await audit_service.list_logs(
        tenant_id=tenant_id,
        filters=filters,
        page=page,
        per_page=per_page
    )
    return success_response(
        data=result["items"],
        message="Audit logs retrieved successfully",
        meta=result["meta"]
    )
