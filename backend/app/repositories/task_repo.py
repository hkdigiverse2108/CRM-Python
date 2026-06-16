import uuid
from datetime import datetime, date, timezone
from typing import Any, Optional
import anyio
from sqlalchemy import text

from backend.app.models.task import Task
from backend.app.repositories.base import BaseRepository
from backend.app.core.database import get_db


class TaskRepository(BaseRepository[Task]):
    """
    MySQL database repository for CRM tasks.
    Filters all queries by workspace_id to guarantee tenant data isolation.
    """

    def _row_to_task(self, row: dict[str, Any]) -> Task:
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

        start_date = row.get("start_date")
        if isinstance(start_date, str):
            start_date = date.fromisoformat(start_date)

        due_date = row.get("due_date")
        if isinstance(due_date, str):
            due_date = date.fromisoformat(due_date)

        reminder_date = row.get("reminder_date")
        if isinstance(reminder_date, str):
            reminder_date = date.fromisoformat(reminder_date)

        return Task(
            task_id=row["task_id"],
            workspace_id=row["workspace_id"],
            title=row["title"],
            type=row.get("type") or "Task",
            priority=row.get("priority") or "Medium",
            status=row.get("status") or "To Do",
            assignee=row.get("assignee") or "Arjun Mehta",
            start_date=start_date,
            due_date=due_date,
            reminder_date=reminder_date,
            description=row.get("description"),
            notes=row.get("notes"),
            project=row.get("project") or "General",
            created_at=created_at or datetime.now(timezone.utc),
            updated_at=updated_at or datetime.now(timezone.utc),
        )

    async def get_by_id(self, entity_id: str, tenant_id: str) -> Optional[Task]:
        def _get():
            with get_db() as db:
                sql = text("""
                    SELECT * FROM tasks 
                    WHERE task_id = :task_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {"task_id": entity_id, "workspace_id": tenant_id}).mappings().first()
                if not res:
                    return None
                return self._row_to_task(res)
        return await anyio.to_thread.run_sync(_get)

    async def get_all(
        self, tenant_id: str, filters: Optional[dict[str, Any]] = None,
        skip: int = 0, limit: int = 200,
    ) -> list[Task]:
        def _get_all():
            with get_db() as db:
                query_str = """
                    SELECT * FROM tasks 
                    WHERE workspace_id = :workspace_id AND deleted_at IS NULL
                """
                params = {"workspace_id": tenant_id}
                if filters:
                    if "status" in filters:
                        query_str += " AND status = :status"
                        params["status"] = filters["status"]
                    if "priority" in filters:
                        query_str += " AND priority = :priority"
                        params["priority"] = filters["priority"]
                    if "project" in filters:
                        query_str += " AND project = :project"
                        params["project"] = filters["project"]

                query_str += " ORDER BY created_at DESC LIMIT :limit OFFSET :skip"
                params["limit"] = limit
                params["skip"] = skip

                res = db.execute(text(query_str), params).mappings().all()
                return [self._row_to_task(r) for r in res]
        return await anyio.to_thread.run_sync(_get_all)

    async def create(self, entity: Task) -> Task:
        def _create():
            with get_db() as db:
                sql = text("""
                    INSERT INTO tasks (
                        task_id, workspace_id, title, type, priority, status, assignee,
                        start_date, due_date, reminder_date, description, notes, project,
                        created_at, updated_at
                    ) VALUES (
                        :task_id, :workspace_id, :title, :type, :priority, :status, :assignee,
                        :start_date, :due_date, :reminder_date, :description, :notes, :project,
                        :created_at, :updated_at
                    )
                """)
                db.execute(sql, {
                    "task_id": entity.task_id,
                    "workspace_id": entity.workspace_id,
                    "title": entity.title,
                    "type": entity.type,
                    "priority": entity.priority,
                    "status": entity.status,
                    "assignee": entity.assignee,
                    "start_date": entity.start_date,
                    "due_date": entity.due_date,
                    "reminder_date": entity.reminder_date,
                    "description": entity.description,
                    "notes": entity.notes,
                    "project": entity.project,
                    "created_at": entity.created_at,
                    "updated_at": entity.updated_at,
                })
                db.commit()
                return entity
        return await anyio.to_thread.run_sync(_create)

    async def update(self, entity_id: str, tenant_id: str, data: dict[str, Any]) -> Optional[Task]:
        def _update():
            with get_db() as db:
                set_clauses = []
                params = {"task_id": entity_id, "workspace_id": tenant_id}

                field_map = {
                    "title": "title",
                    "type": "type",
                    "priority": "priority",
                    "status": "status",
                    "assignee": "assignee",
                    "startDate": "start_date",
                    "dueDate": "due_date",
                    "reminderDate": "reminder_date",
                    "description": "description",
                    "notes": "notes",
                    "project": "project",
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
                    UPDATE tasks 
                    SET {", ".join(set_clauses)}
                    WHERE task_id = :task_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, params)
                db.commit()

                if res.rowcount == 0:
                    return None

        await anyio.to_thread.run_sync(_update)
        return await self.get_by_id(entity_id, tenant_id)

    async def delete(self, entity_id: str, tenant_id: str) -> bool:
        def _delete():
            with get_db() as db:
                sql = text("""
                    UPDATE tasks 
                    SET deleted_at = :deleted_at 
                    WHERE task_id = :task_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {
                    "task_id": entity_id,
                    "workspace_id": tenant_id,
                    "deleted_at": datetime.now(timezone.utc),
                })
                db.commit()
                return res.rowcount > 0
        return await anyio.to_thread.run_sync(_delete)

    async def count(self, tenant_id: str, filters: Optional[dict[str, Any]] = None) -> int:
        def _count():
            with get_db() as db:
                query_str = "SELECT COUNT(*) FROM tasks WHERE workspace_id = :workspace_id AND deleted_at IS NULL"
                params = {"workspace_id": tenant_id}
                if filters:
                    if "status" in filters:
                        query_str += " AND status = :status"
                        params["status"] = filters["status"]
                res = db.execute(text(query_str), params).scalar()
                return res or 0
        return await anyio.to_thread.run_sync(_count)


_task_repo = TaskRepository()

def get_task_repository() -> TaskRepository:
    return _task_repo
