"""
Authentication and Role-Based Access Control Dependencies
==========================================================
FastAPI dependencies to extract current logged-in user and enforce role permissions.
"""

from fastapi import Depends, Request

from backend.app.utils.exceptions import UnauthorizedException, ForbiddenException


def get_current_user(request: Request) -> dict:
    """
    Dependency that retrieves the current authenticated user from request state.
    State is populated by JWTAuthMiddleware.
    
    Raises:
        UnauthorizedException: If user is not present in request state.
    """
    user = getattr(request.state, "user", None)
    if not user:
        raise UnauthorizedException(
            message="Not authenticated. Access token missing or invalid."
        )
    return user


class RoleChecker:
    """
    Dependency factory that checks if the current user has one of the allowed roles.
    
    Usage:
        @router.get("/admin-only", dependencies=[Depends(RoleChecker(["admin"]))])
        async def admin_route():
            ...
    """

    def __init__(self, allowed_roles: list[str]) -> None:
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: dict = Depends(get_current_user)) -> dict:
        user_role = current_user.get("role")
        if user_role not in self.allowed_roles:
            raise ForbiddenException(
                message=f"Permission denied. Required role: one of {self.allowed_roles}. Your role: '{user_role}'"
            )
        return current_user


# Helper aliases for common role requirements
require_admin = RoleChecker(["admin"])
require_manager_or_admin = RoleChecker(["manager", "admin"])


def normalize_backend_path_to_frontend_link(path: str) -> str:
    # Remove prefix /api
    p = path
    if p.startswith("/api"):
        p = p[4:]
    
    # Map common routes
    mappings = {
        "/leads": "/crm/leads",
        "/contacts": "/crm/contacts",
        "/clients": "/crm/clients",
        "/pipeline": "/crm/pipeline",
        "/invoices": "/finance/invoices",
        "/quotes": "/finance/quotes",
        "/payments": "/finance/payments",
        "/ledger": "/finance/ledger",
        "/expenses": "/finance/expenses",
        "/gst": "/finance/gst",
        "/employees": "/hrms/directory",
        "/attendance": "/hrms/attendance",
        "/leaves": "/hrms/leaves",
        "/payroll": "/hrms/payroll",
        "/tasks": "/tasks",
        "/whitelabel": "/admin/whitelabel",
        "/products": "/ecommerce/products"
    }
    for k, v in mappings.items():
        if p.startswith(k):
            return v
            
    if p.startswith("/integrations/"):
        parts = p.split("/")
        if len(parts) >= 3:
            return f"/admin/integrations/{parts[2]}"
            
    return p



class PermissionChecker:
    """
    Dependency factory to check if the current user has the required action permission for a specific module.
    
    Usage:
        @router.get("", dependencies=[Depends(PermissionChecker("finance", "view"))])
    """
    def __init__(self, module: str, action: str) -> None:
        self.module = module
        self.action = action

    def __call__(self, request: Request, current_user: dict = Depends(get_current_user)) -> dict:
        role_name = current_user.get("role_name", "")
        role_id = current_user.get("role", "")
        tenant_id = current_user.get("tenant_id")

        # 1. Enforce SaaS Module & Role Toggle restrictions
        if role_name != "Super Admin" and tenant_id:
            from sqlalchemy import text
            from backend.app.core.database import get_db
            with get_db() as db:
                # Check module status
                if self.module:
                    mod_sql = text("SELECT is_enabled FROM workspace_modules WHERE workspace_id = :ws_id AND module = :module")
                    is_mod_enabled = db.execute(mod_sql, {"ws_id": tenant_id, "module": self.module}).scalar()
                    if is_mod_enabled == 0:
                        raise ForbiddenException(
                            message=f"Access denied. The module '{self.module}' is disabled for your organization."
                        )

                # Check role status
                user_id = current_user.get("id")
                role_check_sql = text("""
                    SELECT wr.is_enabled FROM workspace_roles wr
                    JOIN roles r ON r.role_id = CONCAT('role_', wr.role_suffix, '_', wr.workspace_id)
                    JOIN users u ON u.role_id = r.role_id AND u.workspace_id = wr.workspace_id
                    WHERE u.user_id = :uid
                """)
                is_role_enabled = db.execute(role_check_sql, {"uid": user_id}).scalar()
                if is_role_enabled == 0:
                    raise ForbiddenException(
                        message="Access denied. Your role has been disabled for this organization."
                    )

                # Check granular workspace permissions based on URL path matching
                path_clean = request.url.path.rstrip("/")
                fe_link = normalize_backend_path_to_frontend_link(path_clean)
                col_map = {
                    "create": "can_add",
                    "add": "can_add",
                    "edit": "can_edit",
                    "delete": "can_delete",
                    "view": "can_view"
                }
                col_name = col_map.get(self.action.lower(), "can_view")
                
                perm_sql = text(f"""
                    SELECT {col_name}, can_full
                    FROM workspace_permissions
                    WHERE workspace_id = :ws_id AND module = :module AND link = :link
                    LIMIT 1
                """)
                row = db.execute(perm_sql, {"ws_id": tenant_id, "module": self.module, "link": fe_link}).first()
                if row:
                    allowed = row[0] or row[1]
                    if not allowed:
                        raise ForbiddenException(
                            message=f"Access denied. The action '{self.action}' is disabled for feature '{fe_link}' in your organization."
                        )

        # Super Admins and Org Admins bypass modular action checks
        if role_name in ("Super Admin", "Organization Admin") or role_id == "admin":
            return current_user

        permissions = current_user.get("permissions", {})
        module_perms = permissions.get(self.module, {})
        
        if not module_perms.get(self.action):
            raise ForbiddenException(
                message=f"Access denied. You do not have permission to '{self.action}' on module '{self.module}'."
            )
            
        return current_user


