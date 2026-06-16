"""
Tenant Middleware
==================
Extracts tenant from X-Tenant-ID header.
Validates the tenant via TenantRegistry and sets request.state.tenant.
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from backend.app.core.config import get_settings
from backend.app.core.tenant import get_tenant_registry


# Paths that do NOT require tenant validation
TENANT_SKIP_PATHS = {
    "/",
    "/favicon.ico",
    "/api/auth/meta/login",
    "/api/auth/meta/callback",
    "/api/meta/test-webhook",
    "/api/integrations/shopify/connect",
    "/api/integrations/shopify/callback",
    "/api/integrations/shopify/webhook/orders_create",
    "/api/integrations/shopify/webhook/orders_updated",
    "/api/integrations/shopify/webhook/products_create",
    "/api/integrations/shopify/webhook/customers_create",
    "/webhooks/meta",
    "/api/webhooks/whatsapp",
    "/data-deletion",
    "/api/health",
    "/api/version",
    "/api/status",
    "/docs",
    "/redoc",
    "/openapi.json",
}


class TenantMiddleware(BaseHTTPMiddleware):
    """
    Middleware that identifies and validates tenants.
    
    Tenant detection order:
      1. X-Tenant-ID header
      2. DEFAULT_TENANT from settings (fallback)
    
    Sets `request.state.tenant` with full TenantConfig.
    
    Future: Add subdomain-based tenant detection.
    """

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if path in TENANT_SKIP_PATHS or path.startswith("/docs") or path.startswith("/redoc"):
            return await call_next(request)

        if request.method == "OPTIONS":
            return await call_next(request)

        settings = get_settings()
        registry = get_tenant_registry()

        # Extract tenant ID from header
        tenant_id = request.headers.get("X-Tenant-ID")

        # Reject if no tenant identifier is provided
        if not tenant_id:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "message": "Missing X-Tenant-ID header. Tenant identification is required.",
                    "errors": [{"field": "X-Tenant-ID", "message": "Tenant header is missing"}],
                },
            )

        # TODO: Future — detect tenant from subdomain
        # host = request.headers.get("host", "")
        # subdomain = host.split(".")[0] if "." in host else None

        # Validate tenant
        if not registry.validate_tenant(tenant_id):
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "message": f"Invalid or inactive tenant: '{tenant_id}'",
                    "errors": [{"field": "X-Tenant-ID", "message": "Unknown tenant identifier"}],
                },
            )

        # Attach tenant config to request state
        tenant_config = registry.get_tenant_config(tenant_id)
        request.state.tenant = tenant_config

        return await call_next(request)
