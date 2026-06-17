"""
Authentication Routes
=====================
Endpoints for login, register, token refresh, logout, and getting user profile.
"""

from fastapi import APIRouter, Depends, Request

from backend.app.schemas.auth import LoginRequest, RegisterRequest, RefreshRequest
from backend.app.services.auth_service import AuthService, get_auth_service
from backend.app.api.dependencies.auth import get_current_user
from backend.app.utils.response import success_response

router = APIRouter()


@router.post("/login")
async def login(
    payload: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Authenticate a user using email and password.
    
    Returns JWT access and refresh tokens.
    """
    tokens = await auth_service.login(
        email=payload.email,
        password=payload.password,
    )
    return success_response(data=tokens, message="Logged in successfully")


@router.post("/register")
async def register(
    request: Request,
    payload: RegisterRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Register a new tenant user account.
    
    Returns JWT access and refresh tokens.
    """
    tenant_id = request.state.tenant.id
    tokens = await auth_service.register(
        email=payload.email,
        password=payload.password,
        full_name=payload.full_name,
        role=payload.role,
        tenant_id=tenant_id,
        phone=payload.phone,
    )
    return success_response(data=tokens, message="User registered successfully", status_code=201)


@router.post("/refresh")
async def refresh(
    payload: RefreshRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Obtain a new access token using a valid refresh token.
    """
    tokens = await auth_service.refresh(refresh_token=payload.refresh_token)
    return success_response(data=tokens, message="Token refreshed successfully")


@router.get("/me")
async def get_me(
    current_user: dict = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Retrieve details of the currently authenticated user.
    """
    profile = await auth_service.get_profile(
        user_id=current_user["id"],
        tenant_id=current_user["tenant_id"],
    )
    return success_response(data=profile, message="User profile retrieved successfully")


@router.post("/logout")
async def logout(
    current_user: dict = Depends(get_current_user),
):
    """
    Invalidate the user session/token (client should discard token).
    """
    return success_response(message="Logged out successfully")


@router.get("/workspace-greeting")
async def get_workspace_greeting(request: Request):
    from backend.app.core.database import get_db
    from sqlalchemy import text
    
    tenant_id = None
    try:
        tenant_id = request.state.tenant.id
    except AttributeError:
        pass
        
    if not tenant_id:
        tenant_id = request.headers.get("X-Tenant-ID") or "rapidmodel_corp"
        
    with get_db() as db:
        row = db.execute(text("""
            SELECT workspace_name, logo_url, brand_color, login_greeting 
            FROM workspaces WHERE workspace_id = :ws_id
        """), {"ws_id": tenant_id}).mappings().first()
        
        if not row:
            # Try to match custom domain
            host = request.headers.get("host", "")
            row = db.execute(text("""
                SELECT workspace_name, logo_url, brand_color, login_greeting 
                FROM workspaces WHERE custom_domain = :domain
            """), {"domain": host}).mappings().first()
            
        if not row:
            return success_response(data={
                "company_name": "AIO CRM Platform",
                "logo_url": None,
                "brand_color": "#4f46e5",
                "login_greeting": "Enterprise multi-tenant customer relationship hub"
            })
            
        return success_response(data={
            "company_name": row["workspace_name"],
            "logo_url": row["logo_url"],
            "brand_color": row["brand_color"],
            "login_greeting": row["login_greeting"] or "Enterprise multi-tenant customer relationship hub"
        })

