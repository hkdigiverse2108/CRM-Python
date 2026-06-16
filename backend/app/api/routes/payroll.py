from fastapi import APIRouter, Depends, Query, Request

from backend.app.schemas.payroll import PayrollCreate, PayrollUpdate
from backend.app.services.payroll_service import PayrollService, get_payroll_service
from backend.app.api.dependencies.auth import get_current_user
from backend.app.utils.response import success_response

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("")
async def list_payroll(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(100, ge=1, le=500),
    employeeId: str | None = None,
    month: str | None = None,
    status: str | None = None,
    payroll_service: PayrollService = Depends(get_payroll_service),
):
    tenant_id = request.state.tenant.id
    filters = {}
    if employeeId:
        filters["employeeId"] = employeeId
    if month:
        filters["month"] = month
    if status:
        filters["status"] = status

    result = await payroll_service.list_payroll(
        tenant_id=tenant_id,
        filters=filters,
        page=page,
        per_page=per_page,
    )
    return success_response(
        data=result["items"],
        message="Payroll statements listed successfully",
        meta=result["meta"],
    )


@router.post("/process")
async def process_payroll(
    request: Request,
    month: str = Query(..., min_length=4),
    payroll_service: PayrollService = Depends(get_payroll_service),
):
    tenant_id = request.state.tenant.id
    results = await payroll_service.process_payroll_month(month=month, tenant_id=tenant_id)
    return success_response(data=results, message=f"Payroll processed for month {month}")


@router.post("")
async def create_payroll(
    request: Request,
    payload: PayrollCreate,
    payroll_service: PayrollService = Depends(get_payroll_service),
):
    tenant_id = request.state.tenant.id
    res = await payroll_service.create_payroll(data=payload.model_dump(), tenant_id=tenant_id)
    return success_response(data=res, message="Payroll slip created successfully", status_code=201)


@router.put("/{payroll_id}")
async def update_payroll(
    request: Request,
    payroll_id: str,
    payload: PayrollUpdate,
    payroll_service: PayrollService = Depends(get_payroll_service),
):
    tenant_id = request.state.tenant.id
    updated = await payroll_service.update_payroll(
        payroll_id=payroll_id,
        tenant_id=tenant_id,
        data=payload.model_dump(exclude_unset=True),
    )
    return success_response(data=updated, message="Payroll record updated successfully")


@router.delete("/{payroll_id}")
async def delete_payroll(
    request: Request,
    payroll_id: str,
    payroll_service: PayrollService = Depends(get_payroll_service),
):
    tenant_id = request.state.tenant.id
    await payroll_service.delete_payroll(payroll_id=payroll_id, tenant_id=tenant_id)
    return success_response(message="Payroll record deleted successfully")
