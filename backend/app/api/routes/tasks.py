from fastapi import APIRouter, Depends, Query, Request

from backend.app.schemas.task import TaskCreate, TaskUpdate
from backend.app.services.task_service import TaskService, get_task_service
from backend.app.api.dependencies.auth import get_current_user
from backend.app.utils.response import success_response

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("")
async def list_tasks(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(200, ge=1, le=500),
    status: str | None = None,
    priority: str | None = None,
    project: str | None = None,
    task_service: TaskService = Depends(get_task_service),
):
    tenant_id = request.state.tenant.id
    filters = {}
    if status:
        filters["status"] = status
    if priority:
        filters["priority"] = priority
    if project:
        filters["project"] = project

    result = await task_service.list_tasks(
        tenant_id=tenant_id,
        filters=filters,
        page=page,
        per_page=per_page,
    )
    return success_response(
        data=result["items"],
        message="Tasks listed successfully",
        meta=result["meta"],
    )


@router.post("")
async def create_task(
    request: Request,
    payload: TaskCreate,
    task_service: TaskService = Depends(get_task_service),
):
    tenant_id = request.state.tenant.id
    task = await task_service.create_task(
        data=payload.model_dump(),
        tenant_id=tenant_id,
    )
    return success_response(data=task, message="Task created successfully", status_code=201)


@router.put("/{task_id}")
async def update_task(
    request: Request,
    task_id: str,
    payload: TaskUpdate,
    task_service: TaskService = Depends(get_task_service),
):
    tenant_id = request.state.tenant.id
    updated_task = await task_service.update_task(
        task_id=task_id,
        tenant_id=tenant_id,
        data=payload.model_dump(exclude_unset=True),
    )
    return success_response(data=updated_task, message="Task updated successfully")


@router.delete("/{task_id}")
async def delete_task(
    request: Request,
    task_id: str,
    task_service: TaskService = Depends(get_task_service),
):
    tenant_id = request.state.tenant.id
    await task_service.delete_task(task_id=task_id, tenant_id=tenant_id)
    return success_response(message="Task deleted successfully")
