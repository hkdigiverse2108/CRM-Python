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
    request: Request,
    payload: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Authenticate a user using email and password.
    
    Returns JWT access and refresh tokens.
    """
    tenant_id = request.state.tenant.id
    tokens = await auth_service.login(
        email=payload.email,
        password=payload.password,
        tenant_id=tenant_id,
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
