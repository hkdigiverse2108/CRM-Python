"""
Ledger Repository
=================
Row-level isolation repository for managing General Ledger transactions.
"""

from datetime import datetime, timezone, date
from typing import Any, Optional
import anyio
from sqlalchemy import text

from backend.app.models.ledger import LedgerEntry
from backend.app.repositories.base import BaseRepository
from backend.app.core.database import get_db


class LedgerRepository(BaseRepository[LedgerEntry]):
    """MySQL database repository for General Ledger."""

    def _row_to_entry(self, row: dict[str, Any]) -> LedgerEntry:
        """Helper to construct a LedgerEntry domain model from a database row."""
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

        entry_date = row["date"]
        if isinstance(entry_date, str):
            entry_date = date.fromisoformat(entry_date)

        return LedgerEntry(
            id=row["transaction_id"],
            tenant_id=row["workspace_id"],
            entry_date=entry_date,
            description=row["description"],
            debit=float(row.get("debit") or 0.0),
            credit=float(row.get("credit") or 0.0),
            balance=float(row.get("balance") or 0.0),
            created_at=created_at or datetime.now(timezone.utc),
            updated_at=updated_at or datetime.now(timezone.utc),
        )

    async def get_by_id(self, entity_id: str, tenant_id: str) -> Optional[LedgerEntry]:
        """Retrieve a ledger entry by ID, filtered by workspace_id."""
        def _get():
            with get_db() as db:
                sql = text("""
                    SELECT * FROM finance_ledger 
                    WHERE transaction_id = :transaction_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {"transaction_id": entity_id, "workspace_id": tenant_id}).mappings().first()
                if not res:
                    return None
                return self._row_to_entry(res)
        return await anyio.to_thread.run_sync(_get)

    async def get_last_balance(self, tenant_id: str) -> float:
        """Retrieve the running balance from the most recent ledger entry."""
        def _get_balance():
            with get_db() as db:
                sql = text("""
                    SELECT balance FROM finance_ledger 
                    WHERE workspace_id = :workspace_id AND deleted_at IS NULL
                    ORDER BY created_at DESC, transaction_id DESC LIMIT 1
                """)
                res = db.execute(sql, {"workspace_id": tenant_id}).scalar()
                return float(res) if res is not None else 0.0
        return await anyio.to_thread.run_sync(_get_balance)

    async def get_all(
        self, tenant_id: str, filters: Optional[dict[str, Any]] = None,
        skip: int = 0, limit: int = 100,
    ) -> list[LedgerEntry]:
        """Retrieve paginated ledger entries filtered by workspace_id and optional filters."""
        def _get_all():
            with get_db() as db:
                query_str = """
                    SELECT * FROM finance_ledger 
                    WHERE workspace_id = :workspace_id AND deleted_at IS NULL
                """
                params = {"workspace_id": tenant_id}
                if filters:
                    if "type" in filters:
                        if filters["type"] == "Debit":
                            query_str += " AND debit > 0"
                        elif filters["type"] == "Credit":
                            query_str += " AND credit > 0"
                    if "search" in filters and filters["search"]:
                        query_str += " AND (description LIKE :search OR transaction_id LIKE :search)"
                        params["search"] = f"%{filters['search']}%"

                query_str += " ORDER BY created_at DESC, transaction_id DESC LIMIT :limit OFFSET :skip"
                params["limit"] = limit
                params["skip"] = skip

                res = db.execute(text(query_str), params).mappings().all()
                return [self._row_to_entry(r) for r in res]
        return await anyio.to_thread.run_sync(_get_all)

    async def create(self, entity: LedgerEntry) -> LedgerEntry:
        """Create a new ledger entry."""
        def _create():
            with get_db() as db:
                sql = text("""
                    INSERT INTO finance_ledger (
                        transaction_id, workspace_id, date, description, debit, credit,
                        balance, created_at, updated_at
                    ) VALUES (
                        :transaction_id, :workspace_id, :date, :description, :debit, :credit,
                        :balance, :created_at, :updated_at
                    )
                """)
                db.execute(sql, {
                    "transaction_id": entity.id,
                    "workspace_id": entity.tenant_id,
                    "date": entity.entry_date,
                    "description": entity.description,
                    "debit": entity.debit,
                    "credit": entity.credit,
                    "balance": entity.balance,
                    "created_at": entity.created_at,
                    "updated_at": entity.updated_at,
                })
                db.commit()
                return entity
        return await anyio.to_thread.run_sync(_create)

    async def update(self, entity_id: str, tenant_id: str, data: dict[str, Any]) -> Optional[LedgerEntry]:
        """Update a ledger entry's record in the database."""
        def _update():
            with get_db() as db:
                set_clauses = []
                params = {"transaction_id": entity_id, "workspace_id": tenant_id}

                field_map = {
                    "date": "date",
                    "description": "description",
                    "debit": "debit",
                    "credit": "credit",
                    "balance": "balance",
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
                    UPDATE finance_ledger 
                    SET {", ".join(set_clauses)}
                    WHERE transaction_id = :transaction_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, params)
                db.commit()

                if res.rowcount == 0:
                    return None

        await anyio.to_thread.run_sync(_update)
        return await self.get_by_id(entity_id, tenant_id)

    async def delete(self, entity_id: str, tenant_id: str) -> bool:
        """Soft-delete a ledger entry."""
        def _delete():
            with get_db() as db:
                sql = text("""
                    UPDATE finance_ledger 
                    SET deleted_at = :deleted_at 
                    WHERE transaction_id = :transaction_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {
                    "transaction_id": entity_id,
                    "workspace_id": tenant_id,
                    "deleted_at": datetime.now(timezone.utc),
                })
                db.commit()
                return res.rowcount > 0
        return await anyio.to_thread.run_sync(_delete)

    async def count(self, tenant_id: str, filters: Optional[dict[str, Any]] = None) -> int:
        """Count ledger entries."""
        def _count():
            with get_db() as db:
                query_str = "SELECT COUNT(*) FROM finance_ledger WHERE workspace_id = :workspace_id AND deleted_at IS NULL"
                params = {"workspace_id": tenant_id}
                if filters:
                    if "type" in filters:
                        if filters["type"] == "Debit":
                            query_str += " AND debit > 0"
                        elif filters["type"] == "Credit":
                            query_str += " AND credit > 0"

                res = db.execute(text(query_str), params).scalar()
                return res or 0
        return await anyio.to_thread.run_sync(_count)


_ledger_repo = LedgerRepository()

def get_ledger_repository() -> LedgerRepository:
    return _ledger_repo
