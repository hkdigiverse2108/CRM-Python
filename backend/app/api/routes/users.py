"""
User Management Routes
======================
CRUD endpoints for managing tenant users. Restricted to admin and manager roles.
"""

from fastapi import APIRouter, Depends, Query, Request

from backend.app.schemas.user import UserCreate, UserUpdate
from backend.app.services.user_service import UserService, get_user_service
from backend.app.api.dependencies.auth import require_manager_or_admin
from backend.app.utils.response import success_response

router = APIRouter(dependencies=[Depends(require_manager_or_admin)])


@router.get("")
async def list_users(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    role: str | None = None,
    is_active: bool | None = None,
    user_service: UserService = Depends(get_user_service),
):
    """
    List users with pagination and optional filtering by role and status.
    """
    tenant_id = request.state.tenant.id
    filters = {}
    if role:
        filters["role"] = role
    if is_active is not None:
        filters["is_active"] = is_active

    result = await user_service.list_users(
        tenant_id=tenant_id,
        filters=filters,
        page=page,
        per_page=per_page,
    )
    return success_response(
        data=result["items"],
        message="Users listed successfully",
        meta=result["meta"],
    )


@router.get("/{user_id}")
async def get_user(
    request: Request,
    user_id: str,
    user_service: UserService = Depends(get_user_service),
):
    """
    Retrieve details of a specific user by ID.
    """
    tenant_id = request.state.tenant.id
    user = await user_service.get_user(user_id=user_id, tenant_id=tenant_id)
    return success_response(data=user, message="User retrieved successfully")


@router.post("")
async def create_user(
    request: Request,
    payload: UserCreate,
    user_service: UserService = Depends(get_user_service),
):
    """
    Create a new user under the current tenant.
    """
    tenant_id = request.state.tenant.id
    
    # Enforce plan limits
    from backend.app.core.database import get_db
    from sqlalchemy import text
    from fastapi import HTTPException
    
    with get_db() as db:
        max_users = db.execute(text("SELECT max_users FROM workspaces WHERE workspace_id = :ws_id"), {"ws_id": tenant_id}).scalar()
        if max_users is not None:
            current_users = db.execute(text("SELECT COUNT(*) FROM users WHERE workspace_id = :ws_id AND deleted_at IS NULL"), {"ws_id": tenant_id}).scalar() or 0
            if current_users >= max_users:
                raise HTTPException(
                    status_code=400,
                    detail=f"Subscription limit reached. Your plan allows a maximum of {max_users} users. Please upgrade to create more users."
                )

    user = await user_service.create_user(
        data=payload.model_dump(),
        tenant_id=tenant_id,
    )
    return success_response(data=user, message="User created successfully", status_code=201)


@router.put("/{user_id}")
async def update_user(
    request: Request,
    user_id: str,
    payload: UserUpdate,
    user_service: UserService = Depends(get_user_service),
):
    """
    Update a user's details (e.g. role, email, active status).
    """
    tenant_id = request.state.tenant.id
    updated_user = await user_service.update_user(
        user_id=user_id,
        tenant_id=tenant_id,
        data=payload.model_dump(exclude_unset=True),
    )
    return success_response(data=updated_user, message="User updated successfully")


@router.delete("/{user_id}")
async def delete_user(
    request: Request,
    user_id: str,
    user_service: UserService = Depends(get_user_service),
):
    """
    Deactivate or delete a user from the tenant workspace.
    """
    tenant_id = request.state.tenant.id
    await user_service.delete_user(user_id=user_id, tenant_id=tenant_id)
    return success_response(message="User deleted successfully")
