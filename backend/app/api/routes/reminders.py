from fastapi import APIRouter, Depends, Query, Request

from backend.app.schemas.reminder import ReminderCreate, ReminderUpdate
from backend.app.services.reminder_service import ReminderService, get_reminder_service
from backend.app.api.dependencies.auth import get_current_user
from backend.app.utils.response import success_response

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("")
async def list_reminders(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(200, ge=1, le=500),
    priority: str | None = None,
    completed: bool | None = None,
    reminder_service: ReminderService = Depends(get_reminder_service),
):
    tenant_id = request.state.tenant.id
    filters = {}
    if priority:
        filters["priority"] = priority
    if completed is not None:
        filters["completed"] = completed

    result = await reminder_service.list_reminders(
        tenant_id=tenant_id,
        filters=filters,
        page=page,
        per_page=per_page,
    )
    return success_response(
        data=result["items"],
        message="Reminders listed successfully",
        meta=result["meta"],
    )


@router.post("")
async def create_reminder(
    request: Request,
    payload: ReminderCreate,
    reminder_service: ReminderService = Depends(get_reminder_service),
):
    tenant_id = request.state.tenant.id
    rem = await reminder_service.create_reminder(
        data=payload.model_dump(),
        tenant_id=tenant_id,
    )
    return success_response(data=rem, message="Reminder scheduled successfully", status_code=201)


@router.put("/{reminder_id}")
async def update_reminder(
    request: Request,
    reminder_id: str,
    payload: ReminderUpdate,
    reminder_service: ReminderService = Depends(get_reminder_service),
):
    tenant_id = request.state.tenant.id
    updated_rem = await reminder_service.update_reminder(
        reminder_id=reminder_id,
        tenant_id=tenant_id,
        data=payload.model_dump(exclude_unset=True),
    )
    return success_response(data=updated_rem, message="Reminder updated successfully")


@router.delete("/{reminder_id}")
async def delete_reminder(
    request: Request,
    reminder_id: str,
    reminder_service: ReminderService = Depends(get_reminder_service),
):
    tenant_id = request.state.tenant.id
    await reminder_service.delete_reminder(reminder_id=reminder_id, tenant_id=tenant_id)
    return success_response(message="Reminder deleted successfully")
