"""
Lead Service
==============
Business logic for lead CRUD operations.
"""

from typing import Any, Optional

from backend.app.models.lead import Lead
from backend.app.repositories.lead_repo import LeadRepository, get_lead_repository
from backend.app.utils.exceptions import NotFoundException


class LeadService:
    """Lead management business logic."""

    def __init__(self, lead_repo: LeadRepository | None = None) -> None:
        self._repo = lead_repo or get_lead_repository()

    async def get_lead(self, lead_id: str, tenant_id: str) -> dict:
        lead = await self._repo.get_by_id(lead_id, tenant_id)
        if lead is None:
            raise NotFoundException(f"Lead '{lead_id}' not found")
        return lead.to_dict()

    async def list_leads(
        self, tenant_id: str, filters: Optional[dict[str, Any]] = None,
        page: int = 1, per_page: int = 20,
    ) -> dict:
        skip = (page - 1) * per_page
        leads = await self._repo.get_all(tenant_id, filters, skip=skip, limit=per_page)
        total = await self._repo.count(tenant_id, filters)
        return {
            "items": [l.to_dict() for l in leads],
            "meta": {
                "page": page, "per_page": per_page,
                "total": total, "total_pages": (total + per_page - 1) // per_page,
            },
        }

    async def create_lead(self, data: dict[str, Any], tenant_id: str) -> dict:
        lead = Lead(
            name=data["name"], email=data["email"],
            phone=data.get("phone"), company=data.get("company"),
            source=data.get("source", "website"),
            value=data.get("value", 0.0), notes=data.get("notes"),
            tenant_id=tenant_id,
        )
        created = await self._repo.create(lead)
        return created.to_dict()

    async def update_lead(self, lead_id: str, tenant_id: str, data: dict[str, Any]) -> dict:
        updated = await self._repo.update(lead_id, tenant_id, data)
        if updated is None:
            raise NotFoundException(f"Lead '{lead_id}' not found")
        return updated.to_dict()

    async def delete_lead(self, lead_id: str, tenant_id: str) -> bool:
        deleted = await self._repo.delete(lead_id, tenant_id)
        if not deleted:
            raise NotFoundException(f"Lead '{lead_id}' not found")
        return True


_lead_service = LeadService()

def get_lead_service() -> LeadService:
    return _lead_service
