"""
Project Service
===============
Business logic for project CRUD operations.
"""

from typing import Any, Optional

from backend.app.models.project import Project
from backend.app.repositories.project_repo import ProjectRepository, get_project_repository
from backend.app.utils.exceptions import NotFoundException


class ProjectService:
    """Project management business logic."""

    def __init__(self, project_repo: ProjectRepository | None = None) -> None:
        self._repo = project_repo or get_project_repository()

    async def get_project(self, project_id: str, tenant_id: str) -> dict:
        project = await self._repo.get_by_id(project_id, tenant_id)
        if project is None:
            raise NotFoundException(f"Project '{project_id}' not found")
        return project.to_dict()

    async def list_projects(
        self, tenant_id: str, filters: Optional[dict[str, Any]] = None,
        page: int = 1, per_page: int = 100,
    ) -> dict:
        skip = (page - 1) * per_page
        projects = await self._repo.get_all(tenant_id, filters, skip=skip, limit=per_page)
        total = await self._repo.count(tenant_id, filters)
        return {
            "items": [p.to_dict() for p in projects],
            "meta": {
                "page": page, "per_page": per_page,
                "total": total, "total_pages": (total + per_page - 1) // per_page,
            },
        }

    async def create_project(self, data: dict[str, Any], tenant_id: str) -> dict:
        project = Project(
            tenant_id=tenant_id,
            name=data["name"],
            description=data.get("description"),
            client_id=data.get("client_id"),
            client_name=data.get("client_name"),
            category=data.get("category", "Web Development"),
            type=data.get("type", "Client Project"),
            priority=data.get("priority", "Medium"),
            start_date=data.get("start_date"),
            end_date=data.get("end_date"),
            estimated_completion=data.get("estimated_completion"),
            budget=data.get("budget", 0.0),
            project_value=data.get("project_value", 0.0),
            department=data.get("department", "Engineering"),
            assigned_manager=data.get("assigned_manager"),
            assigned_team=data.get("assigned_team") or [],
            status=data.get("status", "Active"),
            stage=data.get("stage", "New Project"),
            tags=data.get("tags") or [],
            notes=data.get("notes"),
            created_by=data.get("created_by", "CRM Admin"),
        )
        created = await self._repo.create(project)
        return created.to_dict()

    async def update_project(self, project_id: str, tenant_id: str, data: dict[str, Any]) -> dict:
        updated = await self._repo.update(project_id, tenant_id, data)
        if updated is None:
            raise NotFoundException(f"Project '{project_id}' not found")
        return updated.to_dict()

    async def delete_project(self, project_id: str, tenant_id: str) -> bool:
        deleted = await self._repo.delete(project_id, tenant_id)
        if not deleted:
            raise NotFoundException(f"Project '{project_id}' not found")
        return True


_project_service = ProjectService()

def get_project_service() -> ProjectService:
    return _project_service
