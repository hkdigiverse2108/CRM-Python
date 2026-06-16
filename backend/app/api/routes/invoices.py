"""
Invoice API Router
==================
Exposes CRUD endpoints for managing customer invoices.
"""

from fastapi import APIRouter, Depends, Query, Request

from backend.app.schemas.invoice import InvoiceCreate, InvoiceUpdate
from backend.app.services.invoice_service import InvoiceService, get_invoice_service
from backend.app.api.dependencies.auth import get_current_user, PermissionChecker
from backend.app.utils.response import success_response

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("", dependencies=[Depends(PermissionChecker("finance", "view"))])
async def list_invoices(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(100, ge=1, le=500),
    status: str | None = None,
    search: str | None = None,
    invoice_service: InvoiceService = Depends(get_invoice_service),
):
    tenant_id = request.state.tenant.id
    filters = {}
    if status:
        filters["status"] = status
    if search:
        filters["search"] = search

    result = await invoice_service.list_invoices(
        tenant_id=tenant_id,
        filters=filters,
        page=page,
        per_page=per_page,
    )
    return success_response(
        data=result["items"],
        message="Invoices listed successfully",
        meta=result["meta"],
    )


@router.get("/{invoice_id}", dependencies=[Depends(PermissionChecker("finance", "view"))])
async def get_invoice(
    request: Request,
    invoice_id: str,
    invoice_service: InvoiceService = Depends(get_invoice_service),
):
    tenant_id = request.state.tenant.id
    invoice = await invoice_service.get_invoice(invoice_id=invoice_id, tenant_id=tenant_id)
    return success_response(data=invoice, message="Invoice retrieved successfully")


@router.post("", dependencies=[Depends(PermissionChecker("finance", "create"))])
async def create_invoice(
    request: Request,
    payload: InvoiceCreate,
    invoice_service: InvoiceService = Depends(get_invoice_service),
):
    tenant_id = request.state.tenant.id
    invoice = await invoice_service.create_invoice(
        data=payload.model_dump(),
        tenant_id=tenant_id,
    )
    return success_response(data=invoice, message="Invoice created successfully", status_code=201)


@router.put("/{invoice_id}", dependencies=[Depends(PermissionChecker("finance", "edit"))])
async def update_invoice(
    request: Request,
    invoice_id: str,
    payload: InvoiceUpdate,
    invoice_service: InvoiceService = Depends(get_invoice_service),
):
    tenant_id = request.state.tenant.id
    updated = await invoice_service.update_invoice(
        invoice_id=invoice_id,
        tenant_id=tenant_id,
        data=payload.model_dump(exclude_unset=True),
    )
    return success_response(data=updated, message="Invoice updated successfully")


@router.delete("/{invoice_id}", dependencies=[Depends(PermissionChecker("finance", "delete"))])
async def delete_invoice(
    request: Request,
    invoice_id: str,
    invoice_service: InvoiceService = Depends(get_invoice_service),
):
    tenant_id = request.state.tenant.id
    await invoice_service.delete_invoice(invoice_id=invoice_id, tenant_id=tenant_id)
    return success_response(message="Invoice deleted successfully")
