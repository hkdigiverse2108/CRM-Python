"""
Health & Version Routes
=======================
Endpoints to check system health, application status, and current version.
Publicly accessible (whitelisted in middleware).
"""

from fastapi import APIRouter
from backend.app.utils.response import success_response

router = APIRouter()


@router.get("/health")
async def get_health():
    """
    Check the general health status of the application backend.
    """
    return success_response(
        data={"status": "healthy", "database": "disconnected (in-memory mock)"},
        message="System is healthy",
    )


@router.get("/version")
async def get_version():
    """
    Get the current API version details.
    """
    return success_response(
        data={"version": "1.0.0", "api_standard": "v1"},
        message="API version retrieved successfully",
    )


@router.get("/status")
async def get_status():
    """
    Retrieve comprehensive platform diagnostics.
    """
    return success_response(
        data={
            "status": "online",
            "uptime": "active",
            "environment": "development",
            "features": {
                "multi_tenancy": True,
                "role_based_access": True,
                "integrations": ["IndiaMART", "JustDial", "TradeIndia"],
            },
        },
        message="System diagnostics retrieved",
    )
