"""
Expense Repository
==================
Row-level isolation repository for managing business expenses.
"""

from datetime import datetime, timezone, date
from typing import Any, Optional
import anyio
from sqlalchemy import text

from backend.app.models.expense import Expense
from backend.app.repositories.base import BaseRepository
from backend.app.core.database import get_db


class ExpenseRepository(BaseRepository[Expense]):
    """MySQL database repository for Finance Expenses."""

    def _row_to_expense(self, row: dict[str, Any]) -> Expense:
        """Helper to construct an Expense domain model from a database row."""
        created_at = row["created_at"]
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        elif created_at and not created_at.tzinfo:
            created_at = created_at.replace(tzinfo=timezone.utc)

        updated_at = row["updated_at"]
        if isinstance(updated_at, str):
            updated_at = datetime.fromisoformat(updated_at)
        elif updated_at and not updated_at.tzinfo:
            updated_at = updated_at.replace(tzinfo=timezone.utc)

        expense_date = row["date"]
        if isinstance(expense_date, str):
            expense_date = date.fromisoformat(expense_date)

        return Expense(
            id=row["expense_id"],
            tenant_id=row["workspace_id"],
            expense_date=expense_date,
            payee=row["payee"],
            category=row.get("category") or "Cloud Infrastructure",
            method=row.get("method") or "Corporate Card",
            amount=float(row.get("amount") or 0.0),
            status=row.get("status") or "Pending Review",
            created_at=created_at or datetime.now(timezone.utc),
            updated_at=updated_at or datetime.now(timezone.utc),
        )

    async def get_by_id(self, entity_id: str, tenant_id: str) -> Optional[Expense]:
        """Retrieve an expense by ID, filtered by workspace_id."""
        def _get():
            with get_db() as db:
                sql = text("""
                    SELECT * FROM finance_expenses 
                    WHERE expense_id = :expense_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {"expense_id": entity_id, "workspace_id": tenant_id}).mappings().first()
                if not res:
                    return None
                return self._row_to_expense(res)
        return await anyio.to_thread.run_sync(_get)

    async def get_all(
        self, tenant_id: str, filters: Optional[dict[str, Any]] = None,
        skip: int = 0, limit: int = 100,
    ) -> list[Expense]:
        """Retrieve paginated expenses filtered by workspace_id and optional filters."""
        def _get_all():
            with get_db() as db:
                query_str = """
                    SELECT * FROM finance_expenses 
                    WHERE workspace_id = :workspace_id AND deleted_at IS NULL
                """
                params = {"workspace_id": tenant_id}
                if filters:
                    if "category" in filters and filters["category"] and filters["category"] != "All":
                        query_str += " AND category = :category"
                        params["category"] = filters["category"]
                    if "search" in filters and filters["search"]:
                        query_str += " AND (payee LIKE :search OR expense_id LIKE :search OR category LIKE :search)"
                        params["search"] = f"%{filters['search']}%"

                query_str += " ORDER BY created_at DESC LIMIT :limit OFFSET :skip"
                params["limit"] = limit
                params["skip"] = skip

                res = db.execute(text(query_str), params).mappings().all()
                return [self._row_to_expense(r) for r in res]
        return await anyio.to_thread.run_sync(_get_all)

    async def create(self, entity: Expense) -> Expense:
        """Create a new expense."""
        def _create():
            with get_db() as db:
                sql = text("""
                    INSERT INTO finance_expenses (
                        expense_id, workspace_id, date, payee, category, method,
                        amount, status, created_at, updated_at
                    ) VALUES (
                        :expense_id, :workspace_id, :date, :payee, :category, :method,
                        :amount, :status, :created_at, :updated_at
                    )
                """)
                db.execute(sql, {
                    "expense_id": entity.id,
                    "workspace_id": entity.tenant_id,
                    "date": entity.expense_date,
                    "payee": entity.payee,
                    "category": entity.category,
                    "method": entity.method,
                    "amount": entity.amount,
                    "status": entity.status,
                    "created_at": entity.created_at,
                    "updated_at": entity.updated_at,
                })
                db.commit()
                return entity
        return await anyio.to_thread.run_sync(_create)

    async def update(self, entity_id: str, tenant_id: str, data: dict[str, Any]) -> Optional[Expense]:
        """Update an expense's record in the database."""
        def _update():
            with get_db() as db:
                set_clauses = []
                params = {"expense_id": entity_id, "workspace_id": tenant_id}

                # Map frontend keys to DB snake_case columns
                field_map = {
                    "date": "date",
                    "payee": "payee",
                    "category": "category",
                    "method": "method",
                    "amount": "amount",
                    "status": "status",
                }

                for key, val in data.items():
                    db_col = field_map.get(key, key)
                    if db_col in field_map.values():
                        set_clauses.append(f"{db_col} = :{db_col}")
                        params[db_col] = val

                if not set_clauses:
                    return None

                set_clauses.append("updated_at = :updated_at")
                params["updated_at"] = datetime.now(timezone.utc)

                sql = text(f"""
                    UPDATE finance_expenses 
                    SET {", ".join(set_clauses)}
                    WHERE expense_id = :expense_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, params)
                db.commit()

                if res.rowcount == 0:
                    return None

        await anyio.to_thread.run_sync(_update)
        return await self.get_by_id(entity_id, tenant_id)

    async def delete(self, entity_id: str, tenant_id: str) -> bool:
        """Soft-delete an expense."""
        def _delete():
            with get_db() as db:
                sql = text("""
                    UPDATE finance_expenses 
                    SET deleted_at = :deleted_at 
                    WHERE expense_id = :expense_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {
                    "expense_id": entity_id,
                    "workspace_id": tenant_id,
                    "deleted_at": datetime.now(timezone.utc),
                })
                db.commit()
                return res.rowcount > 0
        return await anyio.to_thread.run_sync(_delete)

    async def count(self, tenant_id: str, filters: Optional[dict[str, Any]] = None) -> int:
        """Count expenses."""
        def _count():
            with get_db() as db:
                query_str = "SELECT COUNT(*) FROM finance_expenses WHERE workspace_id = :workspace_id AND deleted_at IS NULL"
                params = {"workspace_id": tenant_id}
                if filters:
                    if "category" in filters and filters["category"] and filters["category"] != "All":
                        query_str += " AND category = :category"
                        params["category"] = filters["category"]

                res = db.execute(text(query_str), params).scalar()
                return res or 0
        return await anyio.to_thread.run_sync(_count)


_expense_repo = ExpenseRepository()

def get_expense_repository() -> ExpenseRepository:
    return _expense_repo
