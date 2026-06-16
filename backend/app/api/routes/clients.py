"""
Client Management Routes
========================
CRUD endpoints for managing business clients.
"""

from fastapi import APIRouter, Depends, Query, Request

from backend.app.schemas.client import ClientCreate, ClientUpdate
from backend.app.services.client_service import ClientService, get_client_service
from backend.app.api.dependencies.auth import get_current_user
from backend.app.utils.response import success_response

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("")
async def list_clients(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: str | None = None,
    client_service: ClientService = Depends(get_client_service),
):
    """
    List clients with pagination and optional filtering by status.
    """
    tenant_id = request.state.tenant.id
    filters = {}
    if status:
        filters["status"] = status

    result = await client_service.list_clients(
        tenant_id=tenant_id,
        filters=filters,
        page=page,
        per_page=per_page,
    )
    return success_response(
        data=result["items"],
        message="Clients listed successfully",
        meta=result["meta"],
    )


@router.get("/{client_id}")
async def get_client(
    request: Request,
    client_id: str,
    client_service: ClientService = Depends(get_client_service),
):
    """
    Retrieve details of a specific client.
    """
    tenant_id = request.state.tenant.id
    client = await client_service.get_client(client_id=client_id, tenant_id=tenant_id)
    return success_response(data=client, message="Client retrieved successfully")


@router.post("")
async def create_client(
    request: Request,
    payload: ClientCreate,
    client_service: ClientService = Depends(get_client_service),
):
    """
    Create a new client under the current tenant.
    """
    tenant_id = request.state.tenant.id
    client = await client_service.create_client(
        data=payload.model_dump(),
        tenant_id=tenant_id,
    )
    return success_response(data=client, message="Client created successfully", status_code=201)


@router.put("/{client_id}")
async def update_client(
    request: Request,
    client_id: str,
    payload: ClientUpdate,
    client_service: ClientService = Depends(get_client_service),
):
    """
    Update details of an existing client.
    """
    tenant_id = request.state.tenant.id
    updated_client = await client_service.update_client(
        client_id=client_id,
        tenant_id=tenant_id,
        data=payload.model_dump(exclude_unset=True),
    )
    return success_response(data=updated_client, message="Client updated successfully")


@router.delete("/{client_id}")
async def delete_client(
    request: Request,
    client_id: str,
    client_service: ClientService = Depends(get_client_service),
):
    """
    Delete a client from the workspace.
    """
    tenant_id = request.state.tenant.id
    await client_service.delete_client(client_id=client_id, tenant_id=tenant_id)
    return success_response(message="Client deleted successfully")
