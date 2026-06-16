"""
User CRUD Schemas
==================
Request/response models for user management endpoints.
"""

from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    """POST /users"""
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=255)
    role: str = Field(default="agent", pattern=r"^(super_admin|admin|manager|agent|finance|support)$")
    phone: Optional[str] = None
    password: str = Field(..., min_length=6, max_length=128)


class UserUpdate(BaseModel):
    """PUT /users/{id}"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(default=None, max_length=255)
    role: Optional[str] = Field(default=None, pattern=r"^(super_admin|admin|manager|agent|finance|support)$")
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    """User entity in API responses."""
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
