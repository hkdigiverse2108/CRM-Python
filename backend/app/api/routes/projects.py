"""
Project Management Routes
=========================
CRUD endpoints for managing projects.
"""

from fastapi import APIRouter, Depends, Query, Request

from backend.app.schemas.project import ProjectCreate, ProjectUpdate
from backend.app.services.project_service import ProjectService, get_project_service
from backend.app.api.dependencies.auth import get_current_user, PermissionChecker
from backend.app.utils.response import success_response

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("", dependencies=[Depends(PermissionChecker("projects", "view"))])
async def list_projects(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(100, ge=1, le=500),
    status: str | None = None,
    priority: str | None = None,
    stage: str | None = None,
    project_service: ProjectService = Depends(get_project_service),
):
    """
    List projects with pagination and filtering.
    """
    tenant_id = request.state.tenant.id
    filters = {}
    if status:
        filters["status"] = status
    if priority:
        filters["priority"] = priority
    if stage:
        filters["stage"] = stage

    result = await project_service.list_projects(
        tenant_id=tenant_id,
        filters=filters,
        page=page,
        per_page=per_page,
    )
    return success_response(
        data=result["items"],
        message="Projects listed successfully",
        meta=result["meta"],
    )


@router.get("/{project_id}", dependencies=[Depends(PermissionChecker("projects", "view"))])
async def get_project(
    request: Request,
    project_id: str,
    project_service: ProjectService = Depends(get_project_service),
):
    """
    Retrieve details of a specific project.
    """
    tenant_id = request.state.tenant.id
    project = await project_service.get_project(project_id=project_id, tenant_id=tenant_id)
    return success_response(data=project, message="Project retrieved successfully")


@router.post("", dependencies=[Depends(PermissionChecker("projects", "create"))])
async def create_project(
    request: Request,
    payload: ProjectCreate,
    project_service: ProjectService = Depends(get_project_service),
):
    """
    Create a new project under the current tenant.
    """
    tenant_id = request.state.tenant.id
    project = await project_service.create_project(
        data=payload.model_dump(),
        tenant_id=tenant_id,
    )
    return success_response(data=project, message="Project created successfully", status_code=201)


@router.put("/{project_id}", dependencies=[Depends(PermissionChecker("projects", "edit"))])
async def update_project(
    request: Request,
    project_id: str,
    payload: ProjectUpdate,
    project_service: ProjectService = Depends(get_project_service),
):
    """
    Update details of an existing project.
    """
    tenant_id = request.state.tenant.id
    updated_project = await project_service.update_project(
        project_id=project_id,
        tenant_id=tenant_id,
        data=payload.model_dump(exclude_unset=True),
    )
    return success_response(data=updated_project, message="Project updated successfully")


@router.delete("/{project_id}", dependencies=[Depends(PermissionChecker("projects", "delete"))])
async def delete_project(
    request: Request,
    project_id: str,
    project_service: ProjectService = Depends(get_project_service),
):
    """
    Delete a project from the workspace.
    """
    tenant_id = request.state.tenant.id
    await project_service.delete_project(project_id=project_id, tenant_id=tenant_id)
    return success_response(message="Project deleted successfully")
