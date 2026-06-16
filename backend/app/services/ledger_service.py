"""
Ledger Service
==============
Coordinates business logic for General Ledger operations.
"""

from typing import Any, Optional
from datetime import date

from backend.app.models.ledger import LedgerEntry
from backend.app.repositories.ledger_repo import LedgerRepository, get_ledger_repository


class LedgerService:
    """Service layer for General Ledger operations."""

    def __init__(self, repository: LedgerRepository):
        self.repository = repository

    async def list_ledger(
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

    async def get_entry(self, entry_id: str, tenant_id: str) -> Optional[dict[str, Any]]:
        entry = await self.repository.get_by_id(entry_id, tenant_id)
        return entry.to_dict() if entry else None

    async def create_entry(self, data: dict[str, Any], tenant_id: str) -> dict[str, Any]:
        debit = float(data.get("debit") or 0.0)
        credit = float(data.get("credit") or 0.0)
        entry_date = data.get("date") or date.today()
        entry_id = data.get("id") or f"LDG-{uuid_part()}"

        # Fetch last balance to compute running balance
        last_balance = await self.repository.get_last_balance(tenant_id)
        
        # Credit increases balance, Debit decreases it (cashbook style)
        balance = last_balance + credit - debit

        entry = LedgerEntry(
            id=entry_id,
            tenant_id=tenant_id,
            entry_date=entry_date,
            description=data["description"],
            debit=debit,
            credit=credit,
            balance=balance
        )

        res = await self.repository.create(entry)
        return res.to_dict()


def uuid_part() -> str:
    import uuid
    return str(uuid.uuid4())[:6].upper()


_ledger_service = LedgerService(get_ledger_repository())

def get_ledger_service() -> LedgerService:
    return _ledger_service
