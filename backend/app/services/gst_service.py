"""
GST Service
===========
Coordinates business logic for GST tax filing records.
"""

from typing import Any, Optional
from datetime import date

from backend.app.models.gst import GstRecord
from backend.app.repositories.gst_repo import GstRepository, get_gst_repository


class GstService:
    """Service layer for GST operations."""

    def __init__(self, repository: GstRepository):
        self.repository = repository

    async def list_records(
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

    async def get_record(self, record_id: str, tenant_id: str) -> Optional[dict[str, Any]]:
        record = await self.repository.get_by_id(record_id, tenant_id)
        return record.to_dict() if record else None

    async def create_record(self, data: dict[str, Any], tenant_id: str) -> dict[str, Any]:
        collected = float(data.get("collected") or 0.0)
        itc = float(data.get("itc") or 0.0)
        net_due = collected - itc

        record_id = data.get("id") or f"GST-2026-{uuid_part()}"
        filed_on = data.get("filed_on")

        record = GstRecord(
            id=record_id,
            tenant_id=tenant_id,
            period=data["period"],
            collected=collected,
            itc=itc,
            net_due=net_due,
            status=data.get("status") or "Draft",
            filed_on=filed_on
        )

        res = await self.repository.create(record)
        return res.to_dict()

    async def update_record(self, record_id: str, tenant_id: str, data: dict[str, Any]) -> Optional[dict[str, Any]]:
        record = await self.repository.get_by_id(record_id, tenant_id)
        if not record:
            return None

        if "collected" in data or "itc" in data:
            collected = float(data.get("collected") if "collected" in data else record.collected)
            itc = float(data.get("itc") if "itc" in data else record.itc)
            data["net_due"] = collected - itc

        res = await self.repository.update(record_id, tenant_id, data)
        return res.to_dict() if res else None

    async def delete_record(self, record_id: str, tenant_id: str) -> bool:
        return await self.repository.delete(record_id, tenant_id)


def uuid_part() -> str:
    import uuid
    return str(uuid.uuid4())[:6].upper()


_gst_service = GstService(get_gst_repository())

def get_gst_service() -> GstService:
    return _gst_service
