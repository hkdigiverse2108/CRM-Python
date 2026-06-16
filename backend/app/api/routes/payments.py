"""
Payment API Router
==================
Exposes CRUD endpoints for managing payment transactions.
"""

from fastapi import APIRouter, Depends, Query, Request

from backend.app.schemas.payment import PaymentCreate, PaymentUpdate
from backend.app.services.payment_service import PaymentService, get_payment_service
from backend.app.api.dependencies.auth import get_current_user
from backend.app.utils.response import success_response

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("")
async def list_payments(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(100, ge=1, le=500),
    status: str | None = None,
    method: str | None = None,
    search: str | None = None,
    payment_service: PaymentService = Depends(get_payment_service),
):
    tenant_id = request.state.tenant.id
    filters = {}
    if status:
        filters["status"] = status
    if method:
        filters["method"] = method
    if search:
        filters["search"] = search

    result = await payment_service.list_payments(
        tenant_id=tenant_id,
        filters=filters,
        page=page,
        per_page=per_page,
    )
    return success_response(
        data=result["items"],
        message="Payments listed successfully",
        meta=result["meta"],
    )


@router.get("/{payment_id}")
async def get_payment(
    request: Request,
    payment_id: str,
    payment_service: PaymentService = Depends(get_payment_service),
):
    tenant_id = request.state.tenant.id
    payment = await payment_service.get_payment(payment_id=payment_id, tenant_id=tenant_id)
    return success_response(data=payment, message="Payment retrieved successfully")


@router.post("")
async def create_payment(
    request: Request,
    payload: PaymentCreate,
    payment_service: PaymentService = Depends(get_payment_service),
):
    tenant_id = request.state.tenant.id
    payment = await payment_service.create_payment(
        data=payload.model_dump(),
        tenant_id=tenant_id,
    )
    return success_response(data=payment, message="Payment created successfully", status_code=201)


@router.put("/{payment_id}")
async def update_payment(
    request: Request,
    payment_id: str,
    payload: PaymentUpdate,
    payment_service: PaymentService = Depends(get_payment_service),
):
    tenant_id = request.state.tenant.id
    updated = await payment_service.update_payment(
        payment_id=payment_id,
        tenant_id=tenant_id,
        data=payload.model_dump(exclude_unset=True),
    )
    return success_response(data=updated, message="Payment updated successfully")


@router.delete("/{payment_id}")
async def delete_payment(
    request: Request,
    payment_id: str,
    payment_service: PaymentService = Depends(get_payment_service),
):
    tenant_id = request.state.tenant.id
    await payment_service.delete_payment(payment_id=payment_id, tenant_id=tenant_id)
    return success_response(message="Payment deleted successfully")
