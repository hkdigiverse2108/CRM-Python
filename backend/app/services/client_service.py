"""
Client Service
===============
Business logic for client CRUD operations.
"""

from typing import Any, Optional

from backend.app.models.client import Client
from backend.app.repositories.client_repo import ClientRepository, get_client_repository
from backend.app.utils.exceptions import NotFoundException


class ClientService:
    """Client management business logic."""

    def __init__(self, client_repo: ClientRepository | None = None) -> None:
        self._repo = client_repo or get_client_repository()

    async def get_client(self, client_id: str, tenant_id: str) -> dict:
        client = await self._repo.get_by_id(client_id, tenant_id)
        if client is None:
            raise NotFoundException(f"Client '{client_id}' not found")
        return client.to_dict()

    async def list_clients(
        self, tenant_id: str, filters: Optional[dict[str, Any]] = None,
        page: int = 1, per_page: int = 20,
    ) -> dict:
        skip = (page - 1) * per_page
        clients = await self._repo.get_all(tenant_id, filters, skip=skip, limit=per_page)
        total = await self._repo.count(tenant_id, filters)
        return {
            "items": [c.to_dict() for c in clients],
            "meta": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "total_pages": (total + per_page - 1) // per_page,
            },
        }

    async def create_client(self, data: dict[str, Any], tenant_id: str) -> dict:
        client = Client(
            tenant_id=tenant_id,
            name=data["name"],
            industry=data.get("industry"),
            business_type=data.get("businessType"),
            gst_number=data.get("gstNumber"),
            pan_number=data.get("panNumber"),
            website=data.get("website"),
            email=data.get("email"),
            phone=data.get("phone"),
            alt_phone=data.get("altPhone"),
            address=data.get("address"),
            city=data.get("city"),
            state=data.get("state"),
            country=data.get("country", "India"),
            postal_code=data.get("postalCode"),
            annual_revenue=data.get("annualRevenue", 0.0),
            employees_count=data.get("employeesCount", 0),
            company_size=data.get("companySize", "1-10"),
            owner_name=data.get("ownerName"),
            account_manager=data.get("accountManager"),
            notes=data.get("notes"),
            status=data.get("status", "Active"),
            projects=data.get("projects", []),
            activities=data.get("activities", []),
            files=data.get("files", []),
            tasks=data.get("tasks", []),
        )
        created = await self._repo.create(client)
        return created.to_dict()

    async def update_client(self, client_id: str, tenant_id: str, data: dict[str, Any]) -> dict:
        # Convert Pydantic fields back to model fields if they match camelCase
        mapped_data = {}
        field_mapping = {
            "businessType": "business_type",
            "gstNumber": "gst_number",
            "panNumber": "pan_number",
            "altPhone": "alt_phone",
            "postalCode": "postal_code",
            "annualRevenue": "annual_revenue",
            "employeesCount": "employees_count",
            "companySize": "company_size",
            "ownerName": "owner_name",
            "accountManager": "account_manager",
        }
        for k, v in data.items():
            if k in field_mapping:
                mapped_data[field_mapping[k]] = v
            else:
                mapped_data[k] = v

        updated = await self._repo.update(client_id, tenant_id, mapped_data)
        if updated is None:
            raise NotFoundException(f"Client '{client_id}' not found")
        return updated.to_dict()

    async def delete_client(self, client_id: str, tenant_id: str) -> bool:
        deleted = await self._repo.delete(client_id, tenant_id)
        if not deleted:
            raise NotFoundException(f"Client '{client_id}' not found")
        return True


_client_service = ClientService()

def get_client_service() -> ClientService:
    return _client_service
