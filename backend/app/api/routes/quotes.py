"""
Quote API Router
================
Exposes CRUD endpoints for managing estimation proposals.
"""

from fastapi import APIRouter, Depends, Query, Request

from backend.app.schemas.quote import QuoteCreate, QuoteUpdate
from backend.app.services.quote_service import QuoteService, get_quote_service
from backend.app.api.dependencies.auth import get_current_user
from backend.app.utils.response import success_response

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("")
async def list_quotes(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(100, ge=1, le=500),
    status: str | None = None,
    search: str | None = None,
    quote_service: QuoteService = Depends(get_quote_service),
):
    tenant_id = request.state.tenant.id
    filters = {}
    if status:
        filters["status"] = status
    if search:
        filters["search"] = search

    result = await quote_service.list_quotes(
        tenant_id=tenant_id,
        filters=filters,
        page=page,
        per_page=per_page,
    )
    return success_response(
        data=result["items"],
        message="Quotes listed successfully",
        meta=result["meta"],
    )


@router.get("/{quote_id}")
async def get_quote(
    request: Request,
    quote_id: str,
    quote_service: QuoteService = Depends(get_quote_service),
):
    tenant_id = request.state.tenant.id
    quote = await quote_service.get_quote(quote_id=quote_id, tenant_id=tenant_id)
    return success_response(data=quote, message="Quote retrieved successfully")


@router.post("")
async def create_quote(
    request: Request,
    payload: QuoteCreate,
    quote_service: QuoteService = Depends(get_quote_service),
):
    tenant_id = request.state.tenant.id
    quote = await quote_service.create_quote(
        data=payload.model_dump(),
        tenant_id=tenant_id,
    )
    return success_response(data=quote, message="Quote created successfully", status_code=201)


@router.put("/{quote_id}")
async def update_quote(
    request: Request,
    quote_id: str,
    payload: QuoteUpdate,
    quote_service: QuoteService = Depends(get_quote_service),
):
    tenant_id = request.state.tenant.id
    updated = await quote_service.update_quote(
        quote_id=quote_id,
        tenant_id=tenant_id,
        data=payload.model_dump(exclude_unset=True),
    )
    return success_response(data=updated, message="Quote updated successfully")


@router.delete("/{quote_id}")
async def delete_quote(
    request: Request,
    quote_id: str,
    quote_service: QuoteService = Depends(get_quote_service),
):
    tenant_id = request.state.tenant.id
    await quote_service.delete_quote(quote_id=quote_id, tenant_id=tenant_id)
    return success_response(message="Quote deleted successfully")
