from fastapi import APIRouter, Depends, Query, Request

from backend.app.schemas.attendance import AttendanceCreate, AttendanceUpdate
from backend.app.services.attendance_service import AttendanceService, get_attendance_service
from backend.app.api.dependencies.auth import get_current_user
from backend.app.utils.response import success_response

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("")
async def list_attendance(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(100, ge=1, le=500),
    employeeId: str | None = None,
    status: str | None = None,
    attendance_service: AttendanceService = Depends(get_attendance_service),
):
    tenant_id = request.state.tenant.id
    filters = {}
    if employeeId:
        filters["employeeId"] = employeeId
    if status:
        filters["status"] = status

    result = await attendance_service.list_attendance(
        tenant_id=tenant_id,
        filters=filters,
        page=page,
        per_page=per_page,
    )
    return success_response(
        data=result["items"],
        message="Attendance records listed successfully",
        meta=result["meta"],
    )


@router.post("/clock-in-out")
async def clock_in_out(
    request: Request,
    payload: AttendanceCreate,
    attendance_service: AttendanceService = Depends(get_attendance_service),
):
    tenant_id = request.state.tenant.id
    res = await attendance_service.clock_in_out(data=payload.model_dump(), tenant_id=tenant_id)
    return success_response(data=res, message="Attendance state toggled successfully")


@router.post("/manual")
async def manual_attendance(
    request: Request,
    payload: AttendanceCreate,
    attendance_service: AttendanceService = Depends(get_attendance_service),
):
    tenant_id = request.state.tenant.id
    res = await attendance_service.manual_attendance(data=payload.model_dump(), tenant_id=tenant_id)
    return success_response(data=res, message="Manual attendance logged successfully")


@router.put("/{attendance_id}")
async def update_attendance(
    request: Request,
    attendance_id: str,
    payload: AttendanceUpdate,
    attendance_service: AttendanceService = Depends(get_attendance_service),
):
    tenant_id = request.state.tenant.id
    updated = await attendance_service.update_attendance(
        attendance_id=attendance_id,
        tenant_id=tenant_id,
        data=payload.model_dump(exclude_unset=True),
    )
    return success_response(data=updated, message="Attendance record updated successfully")


@router.delete("/{attendance_id}")
async def delete_attendance(
    request: Request,
    attendance_id: str,
    attendance_service: AttendanceService = Depends(get_attendance_service),
):
    tenant_id = request.state.tenant.id
    await attendance_service.delete_attendance(attendance_id=attendance_id, tenant_id=tenant_id)
    return success_response(message="Attendance record deleted successfully")
