"""
Lead Management Routes
======================
CRUD endpoints for managing sales prospects (leads).
"""

from fastapi import APIRouter, Depends, Query, Request

from backend.app.schemas.lead import LeadCreate, LeadUpdate
from backend.app.services.lead_service import LeadService, get_lead_service
from backend.app.api.dependencies.auth import get_current_user, PermissionChecker
from backend.app.utils.response import success_response

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("", dependencies=[Depends(PermissionChecker("crm", "view"))])
async def list_leads(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    source: str | None = None,
    status: str | None = None,
    assigned_to: str | None = None,
    lead_service: LeadService = Depends(get_lead_service),
):
    """
    List leads with pagination and optional filtering by source, status, or assignee.
    """
    tenant_id = request.state.tenant.id
    filters = {}
    if source:
        filters["source"] = source
    if status:
        filters["status"] = status
    if assigned_to:
        filters["assigned_to"] = assigned_to

    user = getattr(request.state, "user", None)
    if user:
        filters["current_user_id"] = user.get("id")

    result = await lead_service.list_leads(
        tenant_id=tenant_id,
        filters=filters,
        page=page,
        per_page=per_page,
    )
    return success_response(
        data=result["items"],
        message="Leads listed successfully",
        meta=result["meta"],
    )


@router.get("/{lead_id}", dependencies=[Depends(PermissionChecker("crm", "view"))])
async def get_lead(
    request: Request,
    lead_id: str,
    lead_service: LeadService = Depends(get_lead_service),
):
    """
    Retrieve details of a specific sales lead.
    """
    tenant_id = request.state.tenant.id
    lead = await lead_service.get_lead(lead_id=lead_id, tenant_id=tenant_id)
    return success_response(data=lead, message="Lead retrieved successfully")


@router.post("", dependencies=[Depends(PermissionChecker("crm", "create"))])
async def create_lead(
    request: Request,
    payload: LeadCreate,
    lead_service: LeadService = Depends(get_lead_service),
):
    """
    Create a new lead under the current tenant.
    """
    tenant_id = request.state.tenant.id
    lead = await lead_service.create_lead(
        data=payload.model_dump(),
        tenant_id=tenant_id,
    )
    return success_response(data=lead, message="Lead created successfully", status_code=201)


@router.put("/{lead_id}", dependencies=[Depends(PermissionChecker("crm", "edit"))])
async def update_lead(
    request: Request,
    lead_id: str,
    payload: LeadUpdate,
    lead_service: LeadService = Depends(get_lead_service),
):
    """
    Update details of an existing sales lead.
    """
    tenant_id = request.state.tenant.id
    updated_lead = await lead_service.update_lead(
        lead_id=lead_id,
        tenant_id=tenant_id,
        data=payload.model_dump(exclude_unset=True),
    )
    return success_response(data=updated_lead, message="Lead updated successfully")


@router.delete("/{lead_id}", dependencies=[Depends(PermissionChecker("crm", "delete"))])
async def delete_lead(
    request: Request,
    lead_id: str,
    lead_service: LeadService = Depends(get_lead_service),
):
    """
    Delete a sales lead from the workspace.
    """
    tenant_id = request.state.tenant.id
    await lead_service.delete_lead(lead_id=lead_id, tenant_id=tenant_id)
    return success_response(message="Lead deleted successfully")
