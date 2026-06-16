"""
Expense Service
===============
Coordinates business logic for Expense operations.
"""

from typing import Any, Optional
from datetime import date

from backend.app.models.expense import Expense
from backend.app.repositories.expense_repo import ExpenseRepository, get_expense_repository


class ExpenseService:
    """Service layer for Expense operations."""

    def __init__(self, repository: ExpenseRepository):
        self.repository = repository

    async def list_expenses(
        self, tenant_id: str, filters: Optional[dict[str, Any]] = None,
        page: int = 1, per_page: int = 100
    ) -> dict[str, Any]:
        skip = (page - 1) * per_page
        items = await self.repository.get_all(tenant_id, filters, skip, per_page)
        total = await self.repository.count(tenant_id, filters)
        return {
            "items": [item.to_dict() for item in items],
            "meta": {
                "total": total,
                "page": page,
                "per_page": per_page,
                "pages": (total + per_page - 1) // per_page if total else 1
            }
        }

    async def get_expense(self, expense_id: str, tenant_id: str) -> Optional[dict[str, Any]]:
        expense = await self.repository.get_by_id(expense_id, tenant_id)
        return expense.to_dict() if expense else None

    async def create_expense(self, data: dict[str, Any], tenant_id: str) -> dict[str, Any]:
        expense_id = data.get("id") or f"EXP-{uuid_part()}"
        expense_date = data.get("date") or date.today()

        expense = Expense(
            id=expense_id,
            tenant_id=tenant_id,
            expense_date=expense_date,
            payee=data["payee"],
            category=data.get("category") or "Cloud Infrastructure",
            method=data.get("method") or "Corporate Card",
            amount=float(data["amount"]),
            status=data.get("status") or "Pending Review"
        )

        res = await self.repository.create(expense)
        return res.to_dict()

    async def update_expense(self, expense_id: str, tenant_id: str, data: dict[str, Any]) -> Optional[dict[str, Any]]:
        res = await self.repository.update(expense_id, tenant_id, data)
        return res.to_dict() if res else None

    async def delete_expense(self, expense_id: str, tenant_id: str) -> bool:
        return await self.repository.delete(expense_id, tenant_id)


def uuid_part() -> str:
    import uuid
    return str(uuid.uuid4())[:6].upper()


_expense_service = ExpenseService(get_expense_repository())

def get_expense_service() -> ExpenseService:
    return _expense_service
