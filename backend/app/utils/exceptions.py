"""
Custom Exception Classes
=========================
Application-specific exceptions that map to HTTP status codes.
Caught by global exception handlers in main.py.
"""

from typing import Any, Optional


class AppException(Exception):
    """Base exception for all application errors."""

    def __init__(
        self,
        message: str = "An unexpected error occurred",
        status_code: int = 500,
        errors: Optional[list[Any]] = None,
    ) -> None:
        self.message = message
        self.status_code = status_code
        self.errors = errors or []
        super().__init__(self.message)


class NotFoundException(AppException):
    """Resource not found (HTTP 404)."""

    def __init__(self, message: str = "Resource not found", errors: Optional[list[Any]] = None) -> None:
        super().__init__(message=message, status_code=404, errors=errors)


class UnauthorizedException(AppException):
    """Authentication required or invalid credentials (HTTP 401)."""

    def __init__(self, message: str = "Authentication required", errors: Optional[list[Any]] = None) -> None:
        super().__init__(message=message, status_code=401, errors=errors)


class ForbiddenException(AppException):
    """Insufficient permissions (HTTP 403)."""

    def __init__(self, message: str = "Insufficient permissions", errors: Optional[list[Any]] = None) -> None:
        super().__init__(message=message, status_code=403, errors=errors)


class ValidationException(AppException):
    """Request validation failed (HTTP 422)."""

    def __init__(self, message: str = "Validation failed", errors: Optional[list[Any]] = None) -> None:
        super().__init__(message=message, status_code=422, errors=errors)


class ConflictException(AppException):
    """Resource already exists or conflict (HTTP 409)."""

    def __init__(self, message: str = "Resource conflict", errors: Optional[list[Any]] = None) -> None:
        super().__init__(message=message, status_code=409, errors=errors)


class TenantException(AppException):
    """Invalid or missing tenant (HTTP 400)."""

    def __init__(self, message: str = "Invalid tenant", errors: Optional[list[Any]] = None) -> None:
        super().__init__(message=message, status_code=400, errors=errors)
