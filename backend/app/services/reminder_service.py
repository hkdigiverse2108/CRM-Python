from typing import Any, Optional, Dict
from fastapi import HTTPException
from datetime import datetime, timezone

from backend.app.models.reminder import Reminder
from backend.app.repositories.reminder_repo import ReminderRepository, get_reminder_repository


class ReminderService:
    def __init__(self, reminder_repo: ReminderRepository):
        self.reminder_repo = reminder_repo

    async def get_reminder(self, reminder_id: str, tenant_id: str) -> Dict[str, Any]:
        rem = await self.reminder_repo.get_by_id(reminder_id, tenant_id)
        if not rem:
            raise HTTPException(status_code=404, detail="Reminder not found")
        return rem.to_dict()

    async def list_reminders(
        self, tenant_id: str, filters: Optional[dict[str, Any]] = None, page: int = 1, per_page: int = 200
    ) -> Dict[str, Any]:
        skip = (page - 1) * per_page
        reminders = await self.reminder_repo.get_all(tenant_id, filters, skip, per_page)
        total = await self.reminder_repo.count(tenant_id, filters)
        return {
            "items": [r.to_dict() for r in reminders],
            "meta": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": (total + per_page - 1) // per_page if total > 0 else 0,
            },
        }

    async def create_reminder(self, data: dict[str, Any], tenant_id: str) -> Dict[str, Any]:
        # Frontend fields description is desc
        desc = data.get("desc") or data.get("description") or ""
        rem = Reminder(
            workspace_id=tenant_id,
            description=desc,
            type=data.get("type") or "Call",
            time=data["time"],
            priority=data.get("priority") or "Medium",
            linked_to=data.get("linkedTo") or "Vikram Patel",
            completed=data.get("completed") or False
        )
        created = await self.reminder_repo.create(rem)
        return created.to_dict()

    async def update_reminder(self, reminder_id: str, tenant_id: str, data: dict[str, Any]) -> Dict[str, Any]:
        rem = await self.reminder_repo.get_by_id(reminder_id, tenant_id)
        if not rem:
            raise HTTPException(status_code=404, detail="Reminder not found")
        updated = await self.reminder_repo.update(reminder_id, tenant_id, data)
        if not updated:
            raise HTTPException(status_code=404, detail="Reminder update failed")
        return updated.to_dict()

    async def delete_reminder(self, reminder_id: str, tenant_id: str) -> None:
        rem = await self.reminder_repo.get_by_id(reminder_id, tenant_id)
        if not rem:
            raise HTTPException(status_code=404, detail="Reminder not found")
        await self.reminder_repo.delete(reminder_id, tenant_id)


_reminder_service = ReminderService(get_reminder_repository())

def get_reminder_service() -> ReminderService:
    return _reminder_service
