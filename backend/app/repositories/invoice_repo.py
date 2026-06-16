"""
Invoice Repository
==================
Row-level isolation repository for managing invoice records in MySQL.
"""

import uuid
import json
from datetime import datetime, timezone, date
from typing import Any, Optional
import anyio
from sqlalchemy import text

from backend.app.models.invoice import Invoice
from backend.app.repositories.base import BaseRepository
from backend.app.core.database import get_db


class InvoiceRepository(BaseRepository[Invoice]):
    """MySQL database repository for Finance Invoices."""

    def _row_to_invoice(self, row: dict[str, Any]) -> Invoice:
        """Helper to construct an Invoice domain model from a database row."""
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

        items = []
        if row.get("items"):
            try:
                items = json.loads(row["items"]) if isinstance(row["items"], str) else row["items"]
            except Exception:
                items = []

        invoice_date = row["date"]
        if isinstance(invoice_date, str):
            invoice_date = date.fromisoformat(invoice_date)

        due_date = row["due_date"]
        if isinstance(due_date, str):
            due_date = date.fromisoformat(due_date)

        return Invoice(
            id=row["invoice_id"],
            tenant_id=row["workspace_id"],
            client=row["client"],
            email=row.get("email"),
            invoice_date=invoice_date,
            due_date=due_date,
            status=row.get("status") or "Pending",
            subtotal=float(row.get("subtotal") or 0.0),
            cgst=float(row.get("cgst") or 0.0),
            sgst=float(row.get("sgst") or 0.0),
            tax=float(row.get("tax") or 0.0),
            discount=float(row.get("discount") or 0.0),
            total=float(row.get("total") or 0.0),
            payment_method=row.get("payment_method") or "UPI",
            notes=row.get("notes"),
            items=items,
            created_at=created_at or datetime.now(timezone.utc),
            updated_at=updated_at or datetime.now(timezone.utc),
        )

    async def get_by_id(self, entity_id: str, tenant_id: str) -> Optional[Invoice]:
        """Retrieve an invoice by ID, filtered by workspace_id."""
        def _get():
            with get_db() as db:
                sql = text("""
                    SELECT * FROM finance_invoices 
                    WHERE invoice_id = :invoice_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {"invoice_id": entity_id, "workspace_id": tenant_id}).mappings().first()
                if not res:
                    return None
                return self._row_to_invoice(res)
        return await anyio.to_thread.run_sync(_get)

    async def get_all(
        self, tenant_id: str, filters: Optional[dict[str, Any]] = None,
        skip: int = 0, limit: int = 100,
    ) -> list[Invoice]:
        """Retrieve paginated invoices filtered by workspace_id and optional filters."""
        def _get_all():
            with get_db() as db:
                query_str = """
                    SELECT * FROM finance_invoices 
                    WHERE workspace_id = :workspace_id AND deleted_at IS NULL
                """
                params = {"workspace_id": tenant_id}
                if filters:
                    if "status" in filters and filters["status"]:
                        query_str += " AND status = :status"
                        params["status"] = filters["status"]
                    if "search" in filters and filters["search"]:
                        search_term = filters["search"].strip()[:100]
                        if search_term:
                            query_str += " AND MATCH(client) AGAINST(:search IN NATURAL LANGUAGE MODE)"
                            params["search"] = search_term

                query_str += " ORDER BY created_at DESC LIMIT :limit OFFSET :skip"
                params["limit"] = limit
                params["skip"] = skip

                res = db.execute(text(query_str), params).mappings().all()
                return [self._row_to_invoice(r) for r in res]
        return await anyio.to_thread.run_sync(_get_all)

    async def create(self, entity: Invoice) -> Invoice:
        """Create a new invoice."""
        def _create():
            with get_db() as db:
                sql = text("""
                    INSERT INTO finance_invoices (
                        invoice_id, workspace_id, client, email, date, due_date, status,
                        subtotal, cgst, sgst, tax, discount, total, payment_method,
                        notes, items, created_at, updated_at
                    ) VALUES (
                        :invoice_id, :workspace_id, :client, :email, :date, :due_date, :status,
                        :subtotal, :cgst, :sgst, :tax, :discount, :total, :payment_method,
                        :notes, :items, :created_at, :updated_at
                    )
                """)
                db.execute(sql, {
                    "invoice_id": entity.id,
                    "workspace_id": entity.tenant_id,
                    "client": entity.client,
                    "email": entity.email,
                    "date": entity.invoice_date,
                    "due_date": entity.due_date,
                    "status": entity.status,
                    "subtotal": entity.subtotal,
                    "cgst": entity.cgst,
                    "sgst": entity.sgst,
                    "tax": entity.tax,
                    "discount": entity.discount,
                    "total": entity.total,
                    "payment_method": entity.payment_method,
                    "notes": entity.notes,
                    "items": json.dumps(entity.items),
                    "created_at": entity.created_at,
                    "updated_at": entity.updated_at,
                })
                db.commit()
                return entity
        return await anyio.to_thread.run_sync(_create)

    async def update(self, entity_id: str, tenant_id: str, data: dict[str, Any]) -> Optional[Invoice]:
        """Update an invoice's record in the database."""
        def _update():
            with get_db() as db:
                set_clauses = []
                params = {"invoice_id": entity_id, "workspace_id": tenant_id}

                # Map frontend keys to DB snake_case columns
                field_map = {
                    "client": "client",
                    "email": "email",
                    "date": "date",
                    "due_date": "due_date",
                    "status": "status",
                    "subtotal": "subtotal",
                    "cgst": "cgst",
                    "sgst": "sgst",
                    "tax": "tax",
                    "discount": "discount",
                    "total": "total",
                    "payment_method": "payment_method",
                    "notes": "notes",
                    "items": "items",
                }

                for key, val in data.items():
                    db_col = field_map.get(key, key)
                    if db_col == "items":
                        set_clauses.append(f"{db_col} = :{db_col}")
                        params[db_col] = json.dumps(val) if val is not None else None
                    elif db_col in field_map.values():
                        set_clauses.append(f"{db_col} = :{db_col}")
                        params[db_col] = val

                if not set_clauses:
                    return None

                set_clauses.append("updated_at = :updated_at")
                params["updated_at"] = datetime.now(timezone.utc)

                sql = text(f"""
                    UPDATE finance_invoices 
                    SET {", ".join(set_clauses)}
                    WHERE invoice_id = :invoice_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, params)
                db.commit()

                if res.rowcount == 0:
                    return None

        await anyio.to_thread.run_sync(_update)
        return await self.get_by_id(entity_id, tenant_id)

    async def delete(self, entity_id: str, tenant_id: str) -> bool:
        """Soft-delete an invoice."""
        def _delete():
            with get_db() as db:
                sql = text("""
                    UPDATE finance_invoices 
                    SET deleted_at = :deleted_at 
                    WHERE invoice_id = :invoice_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {
                    "invoice_id": entity_id,
                    "workspace_id": tenant_id,
                    "deleted_at": datetime.now(timezone.utc),
                })
                db.commit()
                return res.rowcount > 0
        return await anyio.to_thread.run_sync(_delete)

    async def count(self, tenant_id: str, filters: Optional[dict[str, Any]] = None) -> int:
        """Count invoices."""
        def _count():
            with get_db() as db:
                query_str = "SELECT COUNT(*) FROM finance_invoices WHERE workspace_id = :workspace_id AND deleted_at IS NULL"
                params = {"workspace_id": tenant_id}
                if filters:
                    if "status" in filters and filters["status"]:
                        query_str += " AND status = :status"
                        params["status"] = filters["status"]

                res = db.execute(text(query_str), params).scalar()
                return res or 0
        return await anyio.to_thread.run_sync(_count)


_invoice_repo = InvoiceRepository()

def get_invoice_repository() -> InvoiceRepository:
    return _invoice_repo
