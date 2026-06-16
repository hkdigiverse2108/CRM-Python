"""
Unified API Response Schemas
==============================
Pydantic models for consistent API response structure.
"""

from typing import Any, Optional
from pydantic import BaseModel


class APIResponse(BaseModel):
    """Standard success response."""
    success: bool = True
    message: str = "Operation successful"
    data: Optional[Any] = None
    meta: Optional[dict[str, Any]] = None


class ErrorResponse(BaseModel):
    """Standard error response."""
    success: bool = False
    message: str = "An error occurred"
    errors: list[Any] = []


class PaginationMeta(BaseModel):
    """Pagination metadata for list responses."""
    page: int = 1
    per_page: int = 20
    total: int = 0
    total_pages: int = 0
