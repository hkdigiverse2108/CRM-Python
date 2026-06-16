"""
Authentication Schemas
=======================
Request/response models for auth endpoints.
"""

from typing import Optional
from pydantic import BaseModel, EmailStr, Field


# ── Requests ─────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    """POST /auth/login"""
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)


class RegisterRequest(BaseModel):
    """POST /auth/register"""
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=255)
    role: str = Field(default="agent", pattern=r"^(super_admin|admin|manager|agent|finance|support)$")
    phone: Optional[str] = None


class RefreshRequest(BaseModel):
    """POST /auth/refresh"""
    refresh_token: str


# ── Responses ────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    """Token pair returned after login/register/refresh."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class UserProfileResponse(BaseModel):
    """GET /auth/me"""
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    tenant_id: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: str
    updated_at: str
