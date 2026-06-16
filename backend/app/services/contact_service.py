"""
Contact Service
================
Business logic for contact CRUD operations.
"""

from typing import Any, Optional

from backend.app.models.contact import Contact
from backend.app.repositories.contact_repo import ContactRepository, get_contact_repository
from backend.app.utils.exceptions import NotFoundException


class ContactService:
    """Contact management business logic."""

    def __init__(self, contact_repo: ContactRepository | None = None) -> None:
        self._repo = contact_repo or get_contact_repository()

    async def get_contact(self, contact_id: str, tenant_id: str) -> dict:
        contact = await self._repo.get_by_id(contact_id, tenant_id)
        if contact is None:
            raise NotFoundException(f"Contact '{contact_id}' not found")
        return contact.to_dict()

    async def list_contacts(
        self, tenant_id: str, filters: Optional[dict[str, Any]] = None,
        page: int = 1, per_page: int = 20,
    ) -> dict:
        skip = (page - 1) * per_page
        contacts = await self._repo.get_all(tenant_id, filters, skip=skip, limit=per_page)
        total = await self._repo.count(tenant_id, filters)
        return {
            "items": [c.to_dict() for c in contacts],
            "meta": {
                "page": page, "per_page": per_page,
                "total": total, "total_pages": (total + per_page - 1) // per_page,
            },
        }

    async def create_contact(self, data: dict[str, Any], tenant_id: str) -> dict:
        contact = Contact(
            name=data["name"], email=data["email"],
            phone=data.get("phone"), company=data.get("company"),
            designation=data.get("designation"),
            contact_type=data.get("contact_type", "customer"),
            tags=data.get("tags", []), address=data.get("address"),
            tenant_id=tenant_id,
        )
        created = await self._repo.create(contact)
        return created.to_dict()

    async def update_contact(self, contact_id: str, tenant_id: str, data: dict[str, Any]) -> dict:
        updated = await self._repo.update(contact_id, tenant_id, data)
        if updated is None:
            raise NotFoundException(f"Contact '{contact_id}' not found")
        return updated.to_dict()

    async def delete_contact(self, contact_id: str, tenant_id: str) -> bool:
        deleted = await self._repo.delete(contact_id, tenant_id)
        if not deleted:
            raise NotFoundException(f"Contact '{contact_id}' not found")
        return True


_contact_service = ContactService()

def get_contact_service() -> ContactService:
    return _contact_service
