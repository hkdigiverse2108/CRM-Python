from fastapi import APIRouter, Depends, Query, Request

from backend.app.schemas.employee import EmployeeCreate, EmployeeUpdate
from backend.app.services.employee_service import EmployeeService, get_employee_service
from backend.app.api.dependencies.auth import get_current_user, PermissionChecker
from backend.app.utils.response import success_response

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("", dependencies=[Depends(PermissionChecker("hrms", "view"))])
async def list_employees(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(100, ge=1, le=500),
    status: str | None = None,
    department: str | None = None,
    search: str | None = None,
    employee_service: EmployeeService = Depends(get_employee_service),
):
    tenant_id = request.state.tenant.id
    filters = {}
    if status:
        filters["status"] = status
    if department:
        filters["department"] = department
    if search:
        filters["search"] = search

    result = await employee_service.list_employees(
        tenant_id=tenant_id,
        filters=filters,
        page=page,
        per_page=per_page,
    )
    return success_response(
        data=result["items"],
        message="Employees listed successfully",
        meta=result["meta"],
    )


@router.get("/{employee_id}", dependencies=[Depends(PermissionChecker("hrms", "view"))])
async def get_employee(
    request: Request,
    employee_id: str,
    employee_service: EmployeeService = Depends(get_employee_service),
):
    tenant_id = request.state.tenant.id
    emp = await employee_service.get_employee(employee_id=employee_id, tenant_id=tenant_id)
    return success_response(data=emp, message="Employee retrieved successfully")


@router.post("", dependencies=[Depends(PermissionChecker("hrms", "create"))])
async def create_employee(
    request: Request,
    payload: EmployeeCreate,
    employee_service: EmployeeService = Depends(get_employee_service),
):
    tenant_id = request.state.tenant.id
    emp = await employee_service.create_employee(
        data=payload.model_dump(),
        tenant_id=tenant_id,
    )
    return success_response(data=emp, message="Employee created successfully", status_code=201)


@router.put("/{employee_id}", dependencies=[Depends(PermissionChecker("hrms", "edit"))])
async def update_employee(
    request: Request,
    employee_id: str,
    payload: EmployeeUpdate,
    employee_service: EmployeeService = Depends(get_employee_service),
):
    tenant_id = request.state.tenant.id
    updated_emp = await employee_service.update_employee(
        employee_id=employee_id,
        tenant_id=tenant_id,
        data=payload.model_dump(exclude_unset=True),
    )
    return success_response(data=updated_emp, message="Employee updated successfully")


@router.delete("/{employee_id}", dependencies=[Depends(PermissionChecker("hrms", "delete"))])
async def delete_employee(
    request: Request,
    employee_id: str,
    employee_service: EmployeeService = Depends(get_employee_service),
):
    tenant_id = request.state.tenant.id
    await employee_service.delete_employee(employee_id=employee_id, tenant_id=tenant_id)
    return success_response(message="Employee deleted successfully")
