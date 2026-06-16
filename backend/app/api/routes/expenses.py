"""
Expense API Router
==================
Exposes CRUD endpoints for managing business expense claims.
"""

from fastapi import APIRouter, Depends, Query, Request

from backend.app.schemas.expense import ExpenseCreate, ExpenseUpdate
from backend.app.services.expense_service import ExpenseService, get_expense_service
from backend.app.api.dependencies.auth import get_current_user, PermissionChecker
from backend.app.utils.response import success_response

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("", dependencies=[Depends(PermissionChecker("finance", "view"))])
async def list_expenses(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(100, ge=1, le=500),
    category: str | None = None,
    search: str | None = None,
    expense_service: ExpenseService = Depends(get_expense_service),
):
    tenant_id = request.state.tenant.id
    filters = {}
    if category:
        filters["category"] = category
    if search:
        filters["search"] = search

    result = await expense_service.list_expenses(
        tenant_id=tenant_id,
        filters=filters,
        page=page,
        per_page=per_page,
    )
    return success_response(
        data=result["items"],
        message="Expenses listed successfully",
        meta=result["meta"],
    )


@router.get("/{expense_id}", dependencies=[Depends(PermissionChecker("finance", "view"))])
async def get_expense(
    request: Request,
    expense_id: str,
    expense_service: ExpenseService = Depends(get_expense_service),
):
    tenant_id = request.state.tenant.id
    expense = await expense_service.get_expense(expense_id=expense_id, tenant_id=tenant_id)
    return success_response(data=expense, message="Expense retrieved successfully")


@router.post("", dependencies=[Depends(PermissionChecker("finance", "create"))])
async def create_expense(
    request: Request,
    payload: ExpenseCreate,
    expense_service: ExpenseService = Depends(get_expense_service),
):
    tenant_id = request.state.tenant.id
    expense = await expense_service.create_expense(
        data=payload.model_dump(),
        tenant_id=tenant_id,
    )
    return success_response(data=expense, message="Expense created successfully", status_code=201)


@router.put("/{expense_id}", dependencies=[Depends(PermissionChecker("finance", "edit"))])
async def update_expense(
    request: Request,
    expense_id: str,
    payload: ExpenseUpdate,
    expense_service: ExpenseService = Depends(get_expense_service),
):
    tenant_id = request.state.tenant.id
    updated = await expense_service.update_expense(
        expense_id=expense_id,
        tenant_id=tenant_id,
        data=payload.model_dump(exclude_unset=True),
    )
    return success_response(data=updated, message="Expense updated successfully")


@router.delete("/{expense_id}", dependencies=[Depends(PermissionChecker("finance", "delete"))])
async def delete_expense(
    request: Request,
    expense_id: str,
    expense_service: ExpenseService = Depends(get_expense_service),
):
    tenant_id = request.state.tenant.id
    await expense_service.delete_expense(expense_id=expense_id, tenant_id=tenant_id)
    return success_response(message="Expense deleted successfully")
