from typing import Any, Optional, Dict
from fastapi import HTTPException
from datetime import datetime, timezone

from backend.app.models.task import Task
from backend.app.repositories.task_repo import TaskRepository, get_task_repository


class TaskService:
    def __init__(self, task_repo: TaskRepository):
        self.task_repo = task_repo

    async def get_task(self, task_id: str, tenant_id: str) -> Dict[str, Any]:
        task = await self.task_repo.get_by_id(task_id, tenant_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return task.to_dict()

    async def list_tasks(
        self, tenant_id: str, filters: Optional[dict[str, Any]] = None, page: int = 1, per_page: int = 200
    ) -> Dict[str, Any]:
        skip = (page - 1) * per_page
        tasks = await self.task_repo.get_all(tenant_id, filters, skip, per_page)
        total = await self.task_repo.count(tenant_id, filters)
        return {
            "items": [t.to_dict() for t in tasks],
            "meta": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": (total + per_page - 1) // per_page if total > 0 else 0,
            },
        }

    async def create_task(self, data: dict[str, Any], tenant_id: str) -> Dict[str, Any]:
        start_date = data.get("startDate")
        due_date = data.get("dueDate")
        reminder_date = data.get("reminderDate")

        task = Task(
            workspace_id=tenant_id,
            title=data["title"],
            type=data.get("type") or "Task",
            priority=data.get("priority") or "Medium",
            status=data.get("status") or "To Do",
            assignee=data.get("assignee") or "Arjun Mehta",
            start_date=start_date,
            due_date=due_date,
            reminder_date=reminder_date,
            description=data.get("description"),
            notes=data.get("notes"),
            project=data.get("project") or "General"
        )
        created = await self.task_repo.create(task)
        return created.to_dict()

    async def update_task(self, task_id: str, tenant_id: str, data: dict[str, Any]) -> Dict[str, Any]:
        task = await self.task_repo.get_by_id(task_id, tenant_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        updated = await self.task_repo.update(task_id, tenant_id, data)
        if not updated:
            raise HTTPException(status_code=404, detail="Task update failed")
        return updated.to_dict()

    async def delete_task(self, task_id: str, tenant_id: str) -> None:
        task = await self.task_repo.get_by_id(task_id, tenant_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        await self.task_repo.delete(task_id, tenant_id)


_task_service = TaskService(get_task_repository())

def get_task_service() -> TaskService:
    return _task_service
