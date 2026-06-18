"""
JWT Authentication Middleware
==============================
Validates the Authorization Bearer token on every request.
Skips public paths (login, register, health, docs).
Sets request.state.user with decoded token payload.
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from backend.app.core.security import decode_token


# Paths that do NOT require authentication
PUBLIC_PATHS = {
    "/",
    "/favicon.ico",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/refresh",
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
    "/api/webhooks/whatsapp/logs",
    "/data-deletion",
    "/api/health",
    "/api/version",
    "/api/status",
    "/docs",
    "/redoc",
    "/openapi.json",
}


class JWTAuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware that validates JWT access tokens.
    
    - Extracts token from `Authorization: Bearer <token>` header.
    - Decodes and validates the token.
    - Sets `request.state.user` with the decoded payload.
    - Returns 401 for invalid/missing tokens on protected routes.
    """

    async def dispatch(self, request: Request, call_next):
        # Skip public paths
        path = request.url.path
        if path in PUBLIC_PATHS or path.startswith("/docs") or path.startswith("/redoc") or path.startswith("/uploads"):
            return await call_next(request)

        # Allow OPTIONS preflight requests
        if request.method == "OPTIONS":
            return await call_next(request)

        # Extract Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=401,
                content={
                    "success": False,
                    "message": "Missing or invalid Authorization header. Expected: Bearer <token>",
                    "errors": [],
                },
            )

        token = auth_header.split("Bearer ")[1].strip()
        payload = decode_token(token)

        if payload is None:
            return JSONResponse(
                status_code=401,
                content={
                    "success": False,
                    "message": "Invalid or expired access token",
                    "errors": [],
                },
            )

        # Verify it's an access token, not a refresh token
        if payload.get("type") != "access":
            return JSONResponse(
                status_code=401,
                content={
                    "success": False,
                    "message": "Invalid token type. Use an access token.",
                    "errors": [],
                },
            )

        # Attach user info to request state
        role_id = payload.get("role")
        tenant_id = payload.get("tenant_id")
        
        # Load permissions for the role
        permissions = {}
        role_name = "Agent"

        role_color = "#6366f1"
        role_status = "active"
        pages_permissions = None
        buttons_permissions = None
        department_access = None
        branch_access = None

        # Super Admin gets full access without DB lookup
        if role_id == "super_admin":
            role_name = "Super Admin"
        elif role_id:
            from sqlalchemy import text
            from backend.app.core.database import get_db
            from backend.app.repositories.user_repo import get_user_repository
            try:
                db_role_id = get_user_repository()._role_to_role_id(role_id, tenant_id)
                with get_db() as db:
                    # Get role details
                    role_sql = text("SELECT role_name, role_color, status, pages_permissions, buttons_permissions, department_access, branch_access FROM roles WHERE role_id = :role_id AND workspace_id = :workspace_id")
                    r_row = db.execute(role_sql, {"role_id": db_role_id, "workspace_id": tenant_id}).mappings().first()
                    if r_row:
                        role_name = r_row["role_name"]
                        role_color = r_row.get("role_color") or "#6366f1"
                        role_status = r_row.get("status") or "active"
                        pages_permissions = r_row.get("pages_permissions")
                        buttons_permissions = r_row.get("buttons_permissions")
                        department_access = r_row.get("department_access")
                        branch_access = r_row.get("branch_access")

                    # Get permissions
                    perm_sql = text("SELECT * FROM role_permissions WHERE role_id = :role_id")
                    rows = db.execute(perm_sql, {"role_id": db_role_id}).mappings().all()
                    for r in rows:
                        permissions[r["module"]] = {
                            "view": bool(r["can_view"]),
                            "create": bool(r["can_create"]),
                            "edit": bool(r["can_edit"]),
                            "delete": bool(r["can_delete"]),
                            "export": bool(r["can_export"]),
                            "import": bool(r["can_import"]),
                            "approve": bool(r["can_approve"]),
                            "assign": bool(r["can_assign"]),
                            "archive": bool(r["can_archive"]),
                            "scope": r.get("record_scope") or "all"
                        }
            except Exception as e:
                print(f"[!] Error loading permissions in JWT middleware: {e}")

        request.state.user = {
            "id": payload.get("sub"),
            "email": payload.get("email"),
            "role": role_id,
            "role_name": role_name,
            "tenant_id": tenant_id,
            "role_color": role_color,
            "role_status": role_status,
            "pages_permissions": pages_permissions,
            "buttons_permissions": buttons_permissions,
            "department_access": department_access,
            "branch_access": branch_access,
            "permissions": permissions,
        }

        return await call_next(request)
