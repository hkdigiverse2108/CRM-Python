"""
Unified API Response Helpers
==============================
Ensures every API response follows the same JSON structure:
  { success, message, data, meta }      — for success
  { success: false, message, errors }   — for errors
"""

from typing import Any, Optional

from fastapi.responses import JSONResponse


def success_response(
    data: Any = None,
    message: str = "Operation successful",
    meta: Optional[dict[str, Any]] = None,
    status_code: int = 200,
) -> JSONResponse:
    """
    Build a standardised success response.

    Args:
        data: The response payload (dict, list, or scalar).
        message: Human-readable success message.
        meta: Optional metadata (pagination, counts, etc.).
        status_code: HTTP status code (default 200).
    """
    body: dict[str, Any] = {
        "success": True,
        "message": message,
        "data": data,
    }
    if meta is not None:
        body["meta"] = meta

    return JSONResponse(content=body, status_code=status_code)


def error_response(
    message: str = "An error occurred",
    errors: Optional[list[Any]] = None,
    status_code: int = 500,
) -> JSONResponse:
    """
    Build a standardised error response.

    Args:
        message: Human-readable error message.
        errors: List of detailed error items.
        status_code: HTTP status code.
    """
    body: dict[str, Any] = {
        "success": False,
        "message": message,
        "errors": errors or [],
    }
    return JSONResponse(content=body, status_code=status_code)
