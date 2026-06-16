from fastapi import APIRouter, Depends, Query, Request

from backend.app.schemas.leave import LeaveCreate, LeaveUpdate
from backend.app.services.leave_service import LeaveService, get_leave_service
from backend.app.api.dependencies.auth import get_current_user
from backend.app.utils.response import success_response

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("")
async def list_leaves(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(100, ge=1, le=500),
    employeeId: str | None = None,
    status: str | None = None,
    leave_service: LeaveService = Depends(get_leave_service),
):
    tenant_id = request.state.tenant.id
    filters = {}
    if employeeId:
        filters["employeeId"] = employeeId
    if status:
        filters["status"] = status

    result = await leave_service.list_leaves(
        tenant_id=tenant_id,
        filters=filters,
        page=page,
        per_page=per_page,
    )
    return success_response(
        data=result["items"],
        message="Leave requests listed successfully",
        meta=result["meta"],
    )


@router.post("")
async def create_leave_request(
    request: Request,
    payload: LeaveCreate,
    leave_service: LeaveService = Depends(get_leave_service),
):
    tenant_id = request.state.tenant.id
    res = await leave_service.create_leave_request(data=payload.model_dump(), tenant_id=tenant_id)
    return success_response(data=res, message="Leave request submitted successfully", status_code=201)


@router.put("/{leave_id}")
async def update_leave_status(
    request: Request,
    leave_id: str,
    payload: LeaveUpdate,
    leave_service: LeaveService = Depends(get_leave_service),
):
    tenant_id = request.state.tenant.id
    updated = await leave_service.update_leave_status(
        leave_id=leave_id,
        tenant_id=tenant_id,
        data=payload.model_dump(exclude_unset=True),
    )
    return success_response(data=updated, message="Leave request updated successfully")


@router.delete("/{leave_id}")
async def delete_leave(
    request: Request,
    leave_id: str,
    leave_service: LeaveService = Depends(get_leave_service),
):
    tenant_id = request.state.tenant.id
    await leave_service.delete_leave(leave_id=leave_id, tenant_id=tenant_id)
    return success_response(message="Leave request deleted successfully")
