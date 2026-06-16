"""
Payment Service
===============
Coordinates business logic for Payment transactions.
"""

from typing import Any, Optional
from datetime import date

from backend.app.models.payment import Payment
from backend.app.repositories.payment_repo import PaymentRepository, get_payment_repository


class PaymentService:
    """Service layer for Payment operations."""

    def __init__(self, repository: PaymentRepository):
        self.repository = repository

    async def list_payments(
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

    async def get_payment(self, payment_id: str, tenant_id: str) -> Optional[dict[str, Any]]:
        payment = await self.repository.get_by_id(payment_id, tenant_id)
        return payment.to_dict() if payment else None

    async def create_payment(self, data: dict[str, Any], tenant_id: str) -> dict[str, Any]:
        payment_id = data.get("id") or f"PAY-{uuid_part()}"
        payment_date = data.get("date") or date.today()
        ref = data.get("reference") or f"MANUAL/TRK-{uuid_part()}"

        payment = Payment(
            id=payment_id,
            tenant_id=tenant_id,
            invoice_id=data["invoice_id"],
            client=data["client"],
            amount=float(data["amount"]),
            method=data.get("method") or "UPI",
            reference=ref,
            payment_date=payment_date,
            status=data.get("status") or "Completed",
            remarks=data.get("remarks")
        )

        res = await self.repository.create(payment)
        return res.to_dict()

    async def update_payment(self, payment_id: str, tenant_id: str, data: dict[str, Any]) -> Optional[dict[str, Any]]:
        res = await self.repository.update(payment_id, tenant_id, data)
        return res.to_dict() if res else None

    async def delete_payment(self, payment_id: str, tenant_id: str) -> bool:
        return await self.repository.delete(payment_id, tenant_id)


def uuid_part() -> str:
    import uuid
    return str(uuid.uuid4())[:6].upper()


_payment_service = PaymentService(get_payment_repository())

def get_payment_service() -> PaymentService:
    return _payment_service
