"""
Contact Management Routes
=========================
CRUD endpoints for managing business relations (contacts: customers, vendors, etc.).
"""

from fastapi import APIRouter, Depends, Query, Request

from backend.app.schemas.contact import ContactCreate, ContactUpdate
from backend.app.services.contact_service import ContactService, get_contact_service
from backend.app.api.dependencies.auth import get_current_user, PermissionChecker
from backend.app.utils.response import success_response

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("", dependencies=[Depends(PermissionChecker("crm", "view"))])
async def list_contacts(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    contact_type: str | None = None,
    contact_service: ContactService = Depends(get_contact_service),
):
    """
    List contacts with pagination and optional filtering by contact type.
    """
    tenant_id = request.state.tenant.id
    filters = {}
    if contact_type:
        filters["contact_type"] = contact_type

    result = await contact_service.list_contacts(
        tenant_id=tenant_id,
        filters=filters,
        page=page,
        per_page=per_page,
    )
    return success_response(
        data=result["items"],
        message="Contacts listed successfully",
        meta=result["meta"],
    )


@router.get("/{contact_id}", dependencies=[Depends(PermissionChecker("crm", "view"))])
async def get_contact(
    request: Request,
    contact_id: str,
    contact_service: ContactService = Depends(get_contact_service),
):
    """
    Retrieve details of a specific contact.
    """
    tenant_id = request.state.tenant.id
    contact = await contact_service.get_contact(contact_id=contact_id, tenant_id=tenant_id)
    return success_response(data=contact, message="Contact retrieved successfully")


@router.post("", dependencies=[Depends(PermissionChecker("crm", "create"))])
async def create_contact(
    request: Request,
    payload: ContactCreate,
    contact_service: ContactService = Depends(get_contact_service),
):
    """
    Create a new contact under the current tenant.
    """
    tenant_id = request.state.tenant.id
    contact = await contact_service.create_contact(
        data=payload.model_dump(),
        tenant_id=tenant_id,
    )
    return success_response(data=contact, message="Contact created successfully", status_code=201)


@router.put("/{contact_id}", dependencies=[Depends(PermissionChecker("crm", "edit"))])
async def update_contact(
    request: Request,
    contact_id: str,
    payload: ContactUpdate,
    contact_service: ContactService = Depends(get_contact_service),
):
    """
    Update details of an existing contact.
    """
    tenant_id = request.state.tenant.id
    updated_contact = await contact_service.update_contact(
        contact_id=contact_id,
        tenant_id=tenant_id,
        data=payload.model_dump(exclude_unset=True),
    )
    return success_response(data=updated_contact, message="Contact updated successfully")


@router.delete("/{contact_id}", dependencies=[Depends(PermissionChecker("crm", "delete"))])
async def delete_contact(
    request: Request,
    contact_id: str,
    contact_service: ContactService = Depends(get_contact_service),
):
    """
    Delete a contact from the workspace.
    """
    tenant_id = request.state.tenant.id
    await contact_service.delete_contact(contact_id=contact_id, tenant_id=tenant_id)
    return success_response(message="Contact deleted successfully")
