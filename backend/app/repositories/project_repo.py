"""
Project Repository
==================
Concrete MySQL database implementation of project data access.
Implements multi-tenant row-level isolation using workspace_id,
soft deletes using deleted_at.
"""

import uuid
import json
from datetime import datetime, date, timezone
from typing import Any, Optional
import anyio
from sqlalchemy import text

from backend.app.models.project import Project
from backend.app.repositories.base import BaseRepository
from backend.app.core.database import get_db


class ProjectRepository(BaseRepository[Project]):
    """
    MySQL database repository for CRM projects.
    Filters all queries by workspace_id to guarantee tenant data isolation.
    """

    def _row_to_project(self, row: dict[str, Any]) -> Project:
        """Helper to construct a Project domain model from a database row."""
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

        assigned_team = []
        if row["assigned_team"]:
            try:
                assigned_team = json.loads(row["assigned_team"]) if isinstance(row["assigned_team"], str) else row["assigned_team"]
            except Exception:
                assigned_team = []

        tags = []
        if row["tags"]:
            try:
                tags = json.loads(row["tags"]) if isinstance(row["tags"], str) else row["tags"]
            except Exception:
                tags = []

        return Project(
            id=row["project_id"],
            tenant_id=row["workspace_id"],
            name=row["name"],
            description=row["description"],
            client_id=row["client_id"],
            client_name=row["client_name"],
            category=row["category"] or "Web Development",
            type=row["type"] or "Client Project",
            priority=row["priority"] or "Medium",
            start_date=row["start_date"],
            end_date=row["end_date"],
            estimated_completion=row["estimated_completion"],
            budget=float(row["budget"] or 0.0),
            project_value=float(row["project_value"] or 0.0),
            department=row["department"] or "Engineering",
            assigned_manager=row["assigned_manager"],
            assigned_team=assigned_team,
            status=row["status"] or "Active",
            stage=row["stage"] or "New Project",
            tags=tags,
            notes=row["notes"],
            created_by=row["created_by"] or "CRM Admin",
            created_at=created_at or datetime.now(timezone.utc),
            updated_at=updated_at or datetime.now(timezone.utc),
        )

    async def get_by_id(self, entity_id: str, tenant_id: str) -> Optional[Project]:
        """Retrieve a project by ID, filtered by workspace_id."""
        def _get():
            with get_db() as db:
                sql = text("""
                    SELECT * FROM projects 
                    WHERE project_id = :project_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {"project_id": entity_id, "workspace_id": tenant_id}).mappings().first()
                if not res:
                    return None
                return self._row_to_project(res)
        return await anyio.to_thread.run_sync(_get)

    async def get_all(
        self, tenant_id: str, filters: Optional[dict[str, Any]] = None,
        skip: int = 0, limit: int = 20,
    ) -> list[Project]:
        """Retrieve paginated projects filtered by workspace_id and optional filters."""
        def _get_all():
            with get_db() as db:
                query_str = """
                    SELECT * FROM projects 
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
                    if "stage" in filters:
                        query_str += " AND stage = :stage"
                        params["stage"] = filters["stage"]
                    if "search" in filters and filters["search"]:
                        search_term = filters["search"].strip()[:100]
                        if search_term:
                            query_str += " AND MATCH(name, description) AGAINST(:search IN NATURAL LANGUAGE MODE)"
                            params["search"] = search_term
                
                query_str += " ORDER BY created_at DESC LIMIT :limit OFFSET :skip"
                params["limit"] = limit
                params["skip"] = skip
                
                res = db.execute(text(query_str), params).mappings().all()
                return [self._row_to_project(r) for r in res]
        return await anyio.to_thread.run_sync(_get_all)

    async def create(self, entity: Project) -> Project:
        """Create a new project."""
        def _create():
            with get_db() as db:
                sql = text("""
                    INSERT INTO projects (
                        project_id, workspace_id, name, description, client_id, client_name,
                        category, type, priority, start_date, end_date, estimated_completion,
                        budget, project_value, department, assigned_manager, assigned_team,
                        status, stage, tags, notes, created_by, created_at, updated_at
                    ) VALUES (
                        :project_id, :workspace_id, :name, :description, :client_id, :client_name,
                        :category, :type, :priority, :start_date, :end_date, :estimated_completion,
                        :budget, :project_value, :department, :assigned_manager, :assigned_team,
                        :status, :stage, :tags, :notes, :created_by, :created_at, :updated_at
                    )
                """)
                db.execute(sql, {
                    "project_id": entity.id,
                    "workspace_id": entity.tenant_id,
                    "name": entity.name,
                    "description": entity.description,
                    "client_id": entity.client_id,
                    "client_name": entity.client_name,
                    "category": entity.category,
                    "type": entity.type,
                    "priority": entity.priority,
                    "start_date": entity.start_date,
                    "end_date": entity.end_date,
                    "estimated_completion": entity.estimated_completion,
                    "budget": entity.budget,
                    "project_value": entity.project_value,
                    "department": entity.department,
                    "assigned_manager": entity.assigned_manager,
                    "assigned_team": json.dumps(entity.assigned_team),
                    "status": entity.status,
                    "stage": entity.stage,
                    "tags": json.dumps(entity.tags),
                    "notes": entity.notes,
                    "created_by": entity.created_by,
                    "created_at": entity.created_at,
                    "updated_at": entity.updated_at,
                })
                db.commit()
                return entity
        return await anyio.to_thread.run_sync(_create)

    async def update(self, entity_id: str, tenant_id: str, data: dict[str, Any]) -> Optional[Project]:
        """Update a project's record in the database."""
        def _update():
            with get_db() as db:
                set_clauses = []
                params = {"project_id": entity_id, "workspace_id": tenant_id}
                
                for key, val in data.items():
                    db_key = key
                    if db_key in ["assigned_team", "tags"]:
                        set_clauses.append(f"{db_key} = :{db_key}")
                        params[db_key] = json.dumps(val) if val is not None else None
                    else:
                        set_clauses.append(f"{db_key} = :{db_key}")
                        params[db_key] = val

                if not set_clauses:
                    return None

                set_clauses.append("updated_at = :updated_at")
                params["updated_at"] = datetime.now(timezone.utc)

                sql = text(f"""
                    UPDATE projects 
                    SET {", ".join(set_clauses)}
                    WHERE project_id = :project_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, params)
                db.commit()
                
                if res.rowcount == 0:
                    return None

        await anyio.to_thread.run_sync(_update)
        return await self.get_by_id(entity_id, tenant_id)

    async def delete(self, entity_id: str, tenant_id: str) -> bool:
        """Soft-delete a project by setting deleted_at timestamp."""
        def _delete():
            with get_db() as db:
                sql = text("""
                    UPDATE projects 
                    SET deleted_at = :deleted_at 
                    WHERE project_id = :project_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {
                    "project_id": entity_id,
                    "workspace_id": tenant_id,
                    "deleted_at": datetime.now(timezone.utc),
                })
                db.commit()
                return res.rowcount > 0
        return await anyio.to_thread.run_sync(_delete)

    async def count(self, tenant_id: str, filters: Optional[dict[str, Any]] = None) -> int:
        """Count total non-deleted projects for a tenant."""
        def _count():
            with get_db() as db:
                query_str = "SELECT COUNT(*) FROM projects WHERE workspace_id = :workspace_id AND deleted_at IS NULL"
                params = {"workspace_id": tenant_id}
                if filters:
                    if "status" in filters:
                        query_str += " AND status = :status"
                        params["status"] = filters["status"]
                    if "priority" in filters:
                        query_str += " AND priority = :priority"
                        params["priority"] = filters["priority"]
                    if "stage" in filters:
                        query_str += " AND stage = :stage"
                        params["stage"] = filters["stage"]
                
                res = db.execute(text(query_str), params).scalar()
                return res or 0
        return await anyio.to_thread.run_sync(_count)


_project_repo = ProjectRepository()

def get_project_repository() -> ProjectRepository:
    return _project_repo
