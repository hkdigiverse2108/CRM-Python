"""
Payment Repository
==================
Row-level isolation repository for managing payments.
"""

from datetime import datetime, timezone, date
from typing import Any, Optional
import anyio
from sqlalchemy import text

from backend.app.models.payment import Payment
from backend.app.repositories.base import BaseRepository
from backend.app.core.database import get_db


class PaymentRepository(BaseRepository[Payment]):
    """MySQL database repository for Finance Payments."""

    def _row_to_payment(self, row: dict[str, Any]) -> Payment:
        """Helper to construct a Payment domain model from a database row."""
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

        payment_date = row["date"]
        if isinstance(payment_date, str):
            payment_date = date.fromisoformat(payment_date)

        return Payment(
            id=row["payment_id"],
            tenant_id=row["workspace_id"],
            invoice_id=row["invoice_id"],
            client=row["client"],
            amount=float(row.get("amount") or 0.0),
            method=row.get("method") or "UPI",
            reference=row.get("reference"),
            payment_date=payment_date,
            status=row.get("status") or "Completed",
            remarks=row.get("remarks"),
            created_at=created_at or datetime.now(timezone.utc),
            updated_at=updated_at or datetime.now(timezone.utc),
        )

    async def get_by_id(self, entity_id: str, tenant_id: str) -> Optional[Payment]:
        """Retrieve a payment by ID, filtered by workspace_id."""
        def _get():
            with get_db() as db:
                sql = text("""
                    SELECT * FROM finance_payments 
                    WHERE payment_id = :payment_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {"payment_id": entity_id, "workspace_id": tenant_id}).mappings().first()
                if not res:
                    return None
                return self._row_to_payment(res)
        return await anyio.to_thread.run_sync(_get)

    async def get_all(
        self, tenant_id: str, filters: Optional[dict[str, Any]] = None,
        skip: int = 0, limit: int = 100,
    ) -> list[Payment]:
        """Retrieve paginated payments filtered by workspace_id and optional filters."""
        def _get_all():
            with get_db() as db:
                query_str = """
                    SELECT * FROM finance_payments 
                    WHERE workspace_id = :workspace_id AND deleted_at IS NULL
                """
                params = {"workspace_id": tenant_id}
                if filters:
                    if "status" in filters and filters["status"]:
                        query_str += " AND status = :status"
                        params["status"] = filters["status"]
                    if "method" in filters and filters["method"] and filters["method"] != "All":
                        query_str += " AND method = :method"
                        params["method"] = filters["method"]
                    if "search" in filters and filters["search"]:
                        query_str += " AND (client LIKE :search OR payment_id LIKE :search OR invoice_id LIKE :search OR reference LIKE :search)"
                        params["search"] = f"%{filters['search']}%"

                query_str += " ORDER BY created_at DESC LIMIT :limit OFFSET :skip"
                params["limit"] = limit
                params["skip"] = skip

                res = db.execute(text(query_str), params).mappings().all()
                return [self._row_to_payment(r) for r in res]
        return await anyio.to_thread.run_sync(_get_all)

    async def create(self, entity: Payment) -> Payment:
        """Create a new payment."""
        def _create():
            with get_db() as db:
                sql = text("""
                    INSERT INTO finance_payments (
                        payment_id, workspace_id, invoice_id, client, amount, method,
                        reference, date, status, remarks, created_at, updated_at
                    ) VALUES (
                        :payment_id, :workspace_id, :invoice_id, :client, :amount, :method,
                        :reference, :date, :status, :remarks, :created_at, :updated_at
                    )
                """)
                db.execute(sql, {
                    "payment_id": entity.id,
                    "workspace_id": entity.tenant_id,
                    "invoice_id": entity.invoice_id,
                    "client": entity.client,
                    "amount": entity.amount,
                    "method": entity.method,
                    "reference": entity.reference,
                    "date": entity.payment_date,
                    "status": entity.status,
                    "remarks": entity.remarks,
                    "created_at": entity.created_at,
                    "updated_at": entity.updated_at,
                })
                db.commit()
                return entity
        return await anyio.to_thread.run_sync(_create)

    async def update(self, entity_id: str, tenant_id: str, data: dict[str, Any]) -> Optional[Payment]:
        """Update a payment's record in the database."""
        def _update():
            with get_db() as db:
                set_clauses = []
                params = {"payment_id": entity_id, "workspace_id": tenant_id}

                # Map frontend keys to DB snake_case columns
                field_map = {
                    "invoice_id": "invoice_id",
                    "client": "client",
                    "amount": "amount",
                    "method": "method",
                    "reference": "reference",
                    "date": "date",
                    "status": "status",
                    "remarks": "remarks",
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
                    UPDATE finance_payments 
                    SET {", ".join(set_clauses)}
                    WHERE payment_id = :payment_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, params)
                db.commit()

                if res.rowcount == 0:
                    return None

        await anyio.to_thread.run_sync(_update)
        return await self.get_by_id(entity_id, tenant_id)

    async def delete(self, entity_id: str, tenant_id: str) -> bool:
        """Soft-delete a payment."""
        def _delete():
            with get_db() as db:
                sql = text("""
                    UPDATE finance_payments 
                    SET deleted_at = :deleted_at 
                    WHERE payment_id = :payment_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {
                    "payment_id": entity_id,
                    "workspace_id": tenant_id,
                    "deleted_at": datetime.now(timezone.utc),
                })
                db.commit()
                return res.rowcount > 0
        return await anyio.to_thread.run_sync(_delete)

    async def count(self, tenant_id: str, filters: Optional[dict[str, Any]] = None) -> int:
        """Count payments."""
        def _count():
            with get_db() as db:
                query_str = "SELECT COUNT(*) FROM finance_payments WHERE workspace_id = :workspace_id AND deleted_at IS NULL"
                params = {"workspace_id": tenant_id}
                if filters:
                    if "status" in filters and filters["status"]:
                        query_str += " AND status = :status"
                        params["status"] = filters["status"]
                    if "method" in filters and filters["method"] and filters["method"] != "All":
                        query_str += " AND method = :method"
                        params["method"] = filters["method"]

                res = db.execute(text(query_str), params).scalar()
                return res or 0
        return await anyio.to_thread.run_sync(_count)


_payment_repo = PaymentRepository()

def get_payment_repository() -> PaymentRepository:
    return _payment_repo
