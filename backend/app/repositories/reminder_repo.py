import uuid
from datetime import datetime, timezone
from typing import Any, Optional
import anyio
from sqlalchemy import text

from backend.app.models.reminder import Reminder
from backend.app.repositories.base import BaseRepository
from backend.app.core.database import get_db


class ReminderRepository(BaseRepository[Reminder]):
    """
    MySQL database repository for Reminders.
    Filters all queries by workspace_id.
    """

    def _row_to_reminder(self, row: dict[str, Any]) -> Reminder:
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

        return Reminder(
            reminder_id=row["reminder_id"],
            workspace_id=row["workspace_id"],
            description=row["description"],
            type=row.get("type") or "Call",
            time=row["time"],
            priority=row.get("priority") or "Medium",
            linked_to=row.get("linked_to") or "Vikram Patel",
            completed=bool(row.get("completed")),
            created_at=created_at or datetime.now(timezone.utc),
            updated_at=updated_at or datetime.now(timezone.utc),
        )

    async def get_by_id(self, entity_id: str, tenant_id: str) -> Optional[Reminder]:
        def _get():
            with get_db() as db:
                sql = text("""
                    SELECT * FROM reminders 
                    WHERE reminder_id = :reminder_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {"reminder_id": entity_id, "workspace_id": tenant_id}).mappings().first()
                if not res:
                    return None
                return self._row_to_reminder(res)
        return await anyio.to_thread.run_sync(_get)

    async def get_all(
        self, tenant_id: str, filters: Optional[dict[str, Any]] = None,
        skip: int = 0, limit: int = 200,
    ) -> list[Reminder]:
        def _get_all():
            with get_db() as db:
                query_str = """
                    SELECT * FROM reminders 
                    WHERE workspace_id = :workspace_id AND deleted_at IS NULL
                """
                params = {"workspace_id": tenant_id}
                if filters:
                    if "priority" in filters:
                        query_str += " AND priority = :priority"
                        params["priority"] = filters["priority"]
                    if "completed" in filters:
                        query_str += " AND completed = :completed"
                        params["completed"] = int(filters["completed"])

                query_str += " ORDER BY time ASC, created_at DESC LIMIT :limit OFFSET :skip"
                params["limit"] = limit
                params["skip"] = skip

                res = db.execute(text(query_str), params).mappings().all()
                return [self._row_to_reminder(r) for r in res]
        return await anyio.to_thread.run_sync(_get_all)

    async def create(self, entity: Reminder) -> Reminder:
        def _create():
            with get_db() as db:
                sql = text("""
                    INSERT INTO reminders (
                        reminder_id, workspace_id, description, type, time, priority, linked_to, completed,
                        created_at, updated_at
                    ) VALUES (
                        :reminder_id, :workspace_id, :description, :type, :time, :priority, :linked_to, :completed,
                        :created_at, :updated_at
                    )
                """)
                db.execute(sql, {
                    "reminder_id": entity.reminder_id,
                    "workspace_id": entity.workspace_id,
                    "description": entity.description,
                    "type": entity.type,
                    "time": entity.time,
                    "priority": entity.priority,
                    "linked_to": entity.linked_to,
                    "completed": int(entity.completed),
                    "created_at": entity.created_at,
                    "updated_at": entity.updated_at,
                })
                db.commit()
                return entity
        return await anyio.to_thread.run_sync(_create)

    async def update(self, entity_id: str, tenant_id: str, data: dict[str, Any]) -> Optional[Reminder]:
        def _update():
            with get_db() as db:
                set_clauses = []
                params = {"reminder_id": entity_id, "workspace_id": tenant_id}

                field_map = {
                    "desc": "description",
                    "description": "description",
                    "type": "type",
                    "time": "time",
                    "priority": "priority",
                    "linkedTo": "linked_to",
                    "linked_to": "linked_to",
                    "completed": "completed",
                }

                for key, val in data.items():
                    db_col = field_map.get(key, key)
                    if db_col in field_map.values():
                        set_clauses.append(f"{db_col} = :{db_col}")
                        if db_col == "completed":
                            params[db_col] = int(val) if val is not None else 0
                        else:
                            params[db_col] = val

                if not set_clauses:
                    return None

                set_clauses.append("updated_at = :updated_at")
                params["updated_at"] = datetime.now(timezone.utc)

                sql = text(f"""
                    UPDATE reminders 
                    SET {", ".join(set_clauses)}
                    WHERE reminder_id = :reminder_id AND workspace_id = :workspace_id AND deleted_at IS NULL
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
                    UPDATE reminders 
                    SET deleted_at = :deleted_at 
                    WHERE reminder_id = :reminder_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {
                    "reminder_id": entity_id,
                    "workspace_id": tenant_id,
                    "deleted_at": datetime.now(timezone.utc),
                })
                db.commit()
                return res.rowcount > 0
        return await anyio.to_thread.run_sync(_delete)

    async def count(self, tenant_id: str, filters: Optional[dict[str, Any]] = None) -> int:
        def _count():
            with get_db() as db:
                query_str = "SELECT COUNT(*) FROM reminders WHERE workspace_id = :workspace_id AND deleted_at IS NULL"
                params = {"workspace_id": tenant_id}
                if filters:
                    if "completed" in filters:
                        query_str += " AND completed = :completed"
                        params["completed"] = int(filters["completed"])
                res = db.execute(text(query_str), params).scalar()
                return res or 0
        return await anyio.to_thread.run_sync(_count)


_reminder_repo = ReminderRepository()

def get_reminder_repository() -> ReminderRepository:
    return _reminder_repo
