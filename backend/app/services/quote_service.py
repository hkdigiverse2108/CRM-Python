"""
Quote Service
=============
Coordinates business logic for Quote operations.
"""

from typing import Any, Optional
from datetime import date

from backend.app.models.quote import Quote
from backend.app.repositories.quote_repo import QuoteRepository, get_quote_repository


class QuoteService:
    """Service layer for Quote operations."""

    def __init__(self, repository: QuoteRepository):
        self.repository = repository

    async def list_quotes(
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

    async def get_quote(self, quote_id: str, tenant_id: str) -> Optional[dict[str, Any]]:
        quote = await self.repository.get_by_id(quote_id, tenant_id)
        return quote.to_dict() if quote else None

    async def create_quote(self, data: dict[str, Any], tenant_id: str) -> dict[str, Any]:
        price = float(data.get("price") or 0.0)
        qty = int(data.get("quantity") or 1)
        discount = float(data.get("discount") or 0.0)
        tax = float(data.get("tax") or 0.0)
        
        calculated_total = (price * qty) - discount + tax
        total = calculated_total if calculated_total > 0 else float(data.get("total") or 0.0)

        quote_id = data.get("id") or f"QT-2026-{uuid_part()}"
        quote_date = data.get("date") or date.today()
        valid_until = data.get("valid_until") or date.today()

        quote = Quote(
            id=quote_id,
            tenant_id=tenant_id,
            client=data["client"],
            quote_date=quote_date,
            valid_until=valid_until,
            status=data.get("status") or "Sent",
            product_name=data.get("product_name") or "General Proposal",
            quantity=qty,
            price=price,
            discount=discount,
            tax=tax,
            total=total,
            notes=data.get("notes")
        )

        res = await self.repository.create(quote)
        return res.to_dict()

    async def update_quote(self, quote_id: str, tenant_id: str, data: dict[str, Any]) -> Optional[dict[str, Any]]:
        quote = await self.repository.get_by_id(quote_id, tenant_id)
        if not quote:
            return None

        if "price" in data or "quantity" in data or "discount" in data or "tax" in data:
            price = float(data.get("price") if "price" in data else quote.price)
            qty = int(data.get("quantity") if "quantity" in data else quote.quantity)
            discount = float(data.get("discount") if "discount" in data else quote.discount)
            tax = float(data.get("tax") if "tax" in data else quote.tax)
            data["total"] = (price * qty) - discount + tax

        res = await self.repository.update(quote_id, tenant_id, data)
        return res.to_dict() if res else None

    async def delete_quote(self, quote_id: str, tenant_id: str) -> bool:
        return await self.repository.delete(quote_id, tenant_id)


def uuid_part() -> str:
    import uuid
    return str(uuid.uuid4())[:6].upper()


_quote_service = QuoteService(get_quote_repository())

def get_quote_service() -> QuoteService:
    return _quote_service
