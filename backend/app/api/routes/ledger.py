"""
Ledger API Router
=================
Exposes endpoints for posting and retrieving General Ledger journal entries.
"""

from fastapi import APIRouter, Depends, Query, Request

from backend.app.schemas.ledger import LedgerCreate
from backend.app.services.ledger_service import LedgerService, get_ledger_service
from backend.app.api.dependencies.auth import get_current_user
from backend.app.utils.response import success_response

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("")
async def list_ledger(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(100, ge=1, le=500),
    type: str | None = None,
    search: str | None = None,
    ledger_service: LedgerService = Depends(get_ledger_service),
):
    tenant_id = request.state.tenant.id
    filters = {}
    if type:
        filters["type"] = type
    if search:
        filters["search"] = search

    result = await ledger_service.list_ledger(
        tenant_id=tenant_id,
        filters=filters,
        page=page,
        per_page=per_page,
    )
    return success_response(
        data=result["items"],
        message="Ledger transactions listed successfully",
        meta=result["meta"],
    )


@router.post("")
async def create_entry(
    request: Request,
    payload: LedgerCreate,
    ledger_service: LedgerService = Depends(get_ledger_service),
):
    tenant_id = request.state.tenant.id
    entry = await ledger_service.create_entry(
        data=payload.model_dump(),
        tenant_id=tenant_id,
    )
    return success_response(data=entry, message="Ledger transaction posted successfully", status_code=201)
