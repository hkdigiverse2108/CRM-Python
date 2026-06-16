"""
Quote Repository
================
Row-level isolation repository for managing quotes.
"""

from datetime import datetime, timezone, date
from typing import Any, Optional
import anyio
from sqlalchemy import text

from backend.app.models.quote import Quote
from backend.app.repositories.base import BaseRepository
from backend.app.core.database import get_db


class QuoteRepository(BaseRepository[Quote]):
    """MySQL database repository for Finance Quotes."""

    def _row_to_quote(self, row: dict[str, Any]) -> Quote:
        """Helper to construct a Quote domain model from a database row."""
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

        quote_date = row["date"]
        if isinstance(quote_date, str):
            quote_date = date.fromisoformat(quote_date)

        valid_until = row["valid_until"]
        if isinstance(valid_until, str):
            valid_until = date.fromisoformat(valid_until)

        return Quote(
            id=row["quote_id"],
            tenant_id=row["workspace_id"],
            client=row["client"],
            quote_date=quote_date,
            valid_until=valid_until,
            status=row.get("status") or "Sent",
            product_name=row.get("product_name") or "General Proposal",
            quantity=int(row.get("quantity") or 1),
            price=float(row.get("price") or 0.0),
            discount=float(row.get("discount") or 0.0),
            tax=float(row.get("tax") or 0.0),
            total=float(row.get("total") or 0.0),
            notes=row.get("notes"),
            created_at=created_at or datetime.now(timezone.utc),
            updated_at=updated_at or datetime.now(timezone.utc),
        )

    async def get_by_id(self, entity_id: str, tenant_id: str) -> Optional[Quote]:
        """Retrieve a quote by ID, filtered by workspace_id."""
        def _get():
            with get_db() as db:
                sql = text("""
                    SELECT * FROM finance_quotes 
                    WHERE quote_id = :quote_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {"quote_id": entity_id, "workspace_id": tenant_id}).mappings().first()
                if not res:
                    return None
                return self._row_to_quote(res)
        return await anyio.to_thread.run_sync(_get)

    async def get_all(
        self, tenant_id: str, filters: Optional[dict[str, Any]] = None,
        skip: int = 0, limit: int = 100,
    ) -> list[Quote]:
        """Retrieve paginated quotes filtered by workspace_id and optional filters."""
        def _get_all():
            with get_db() as db:
                query_str = """
                    SELECT * FROM finance_quotes 
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
                            query_str += " AND MATCH(client, product_name) AGAINST(:search IN NATURAL LANGUAGE MODE)"
                            params["search"] = search_term

                query_str += " ORDER BY created_at DESC LIMIT :limit OFFSET :skip"
                params["limit"] = limit
                params["skip"] = skip

                res = db.execute(text(query_str), params).mappings().all()
                return [self._row_to_quote(r) for r in res]
        return await anyio.to_thread.run_sync(_get_all)

    async def create(self, entity: Quote) -> Quote:
        """Create a new quote."""
        def _create():
            with get_db() as db:
                sql = text("""
                    INSERT INTO finance_quotes (
                        quote_id, workspace_id, client, date, valid_until, status,
                        product_name, quantity, price, discount, tax, total,
                        notes, created_at, updated_at
                    ) VALUES (
                        :quote_id, :workspace_id, :client, :date, :valid_until, :status,
                        :product_name, :quantity, :price, :discount, :tax, :total,
                        :notes, :created_at, :updated_at
                    )
                """)
                db.execute(sql, {
                    "quote_id": entity.id,
                    "workspace_id": entity.tenant_id,
                    "client": entity.client,
                    "date": entity.quote_date,
                    "valid_until": entity.valid_until,
                    "status": entity.status,
                    "product_name": entity.product_name,
                    "quantity": entity.quantity,
                    "price": entity.price,
                    "discount": entity.discount,
                    "tax": entity.tax,
                    "total": entity.total,
                    "notes": entity.notes,
                    "created_at": entity.created_at,
                    "updated_at": entity.updated_at,
                })
                db.commit()
                return entity
        return await anyio.to_thread.run_sync(_create)

    async def update(self, entity_id: str, tenant_id: str, data: dict[str, Any]) -> Optional[Quote]:
        """Update a quote's record in the database."""
        def _update():
            with get_db() as db:
                set_clauses = []
                params = {"quote_id": entity_id, "workspace_id": tenant_id}

                # Map frontend keys to DB snake_case columns
                field_map = {
                    "client": "client",
                    "date": "date",
                    "valid_until": "valid_until",
                    "status": "status",
                    "product_name": "product_name",
                    "quantity": "quantity",
                    "price": "price",
                    "discount": "discount",
                    "tax": "tax",
                    "total": "total",
                    "notes": "notes",
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
                    UPDATE finance_quotes 
                    SET {", ".join(set_clauses)}
                    WHERE quote_id = :quote_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, params)
                db.commit()

                if res.rowcount == 0:
                    return None

        await anyio.to_thread.run_sync(_update)
        return await self.get_by_id(entity_id, tenant_id)

    async def delete(self, entity_id: str, tenant_id: str) -> bool:
        """Soft-delete a quote."""
        def _delete():
            with get_db() as db:
                sql = text("""
                    UPDATE finance_quotes 
                    SET deleted_at = :deleted_at 
                    WHERE quote_id = :quote_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {
                    "quote_id": entity_id,
                    "workspace_id": tenant_id,
                    "deleted_at": datetime.now(timezone.utc),
                })
                db.commit()
                return res.rowcount > 0
        return await anyio.to_thread.run_sync(_delete)

    async def count(self, tenant_id: str, filters: Optional[dict[str, Any]] = None) -> int:
        """Count quotes."""
        def _count():
            with get_db() as db:
                query_str = "SELECT COUNT(*) FROM finance_quotes WHERE workspace_id = :workspace_id AND deleted_at IS NULL"
                params = {"workspace_id": tenant_id}
                if filters:
                    if "status" in filters and filters["status"]:
                        query_str += " AND status = :status"
                        params["status"] = filters["status"]

                res = db.execute(text(query_str), params).scalar()
                return res or 0
        return await anyio.to_thread.run_sync(_count)


_quote_repo = QuoteRepository()

def get_quote_repository() -> QuoteRepository:
    return _quote_repo
