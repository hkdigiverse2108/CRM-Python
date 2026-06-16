"""
GST API Router
==============
Exposes endpoints for managing GSTR return filings and challans.
"""

from fastapi import APIRouter, Depends, Query, Request

from backend.app.schemas.gst import GstCreate, GstUpdate
from backend.app.services.gst_service import GstService, get_gst_service
from backend.app.api.dependencies.auth import get_current_user
from backend.app.utils.response import success_response

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("")
async def list_records(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(100, ge=1, le=500),
    status: str | None = None,
    search: str | None = None,
    gst_service: GstService = Depends(get_gst_service),
):
    tenant_id = request.state.tenant.id
    filters = {}
    if status:
        filters["status"] = status
    if search:
        filters["search"] = search

    result = await gst_service.list_records(
        tenant_id=tenant_id,
        filters=filters,
        page=page,
        per_page=per_page,
    )
    return success_response(
        data=result["items"],
        message="GST records listed successfully",
        meta=result["meta"],
    )


@router.get("/{record_id}")
async def get_record(
    request: Request,
    record_id: str,
    gst_service: GstService = Depends(get_gst_service),
):
    tenant_id = request.state.tenant.id
    record = await gst_service.get_record(record_id=record_id, tenant_id=tenant_id)
    return success_response(data=record, message="GST record retrieved successfully")


@router.post("")
async def create_record(
    request: Request,
    payload: GstCreate,
    gst_service: GstService = Depends(get_gst_service),
):
    tenant_id = request.state.tenant.id
    record = await gst_service.create_record(
        data=payload.model_dump(),
        tenant_id=tenant_id,
    )
    return success_response(data=record, message="GST record created successfully", status_code=201)


@router.put("/{record_id}")
async def update_record(
    request: Request,
    record_id: str,
    payload: GstUpdate,
    gst_service: GstService = Depends(get_gst_service),
):
    tenant_id = request.state.tenant.id
    updated = await gst_service.update_record(
        record_id=record_id,
        tenant_id=tenant_id,
        data=payload.model_dump(exclude_unset=True),
    )
    return success_response(data=updated, message="GST record updated successfully")


@router.delete("/{record_id}")
async def delete_record(
    request: Request,
    record_id: str,
    gst_service: GstService = Depends(get_gst_service),
):
    tenant_id = request.state.tenant.id
    await gst_service.delete_record(record_id=record_id, tenant_id=tenant_id)
    return success_response(message="GST record deleted successfully")
