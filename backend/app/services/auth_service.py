"""
Authentication Service
=======================
Business logic for login, register, token refresh, and profile retrieval.
All data access goes through UserRepository — never direct.
"""

from backend.app.core.config import get_settings
from backend.app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from backend.app.models.user import User
from backend.app.repositories.user_repo import UserRepository, get_user_repository
from backend.app.utils.exceptions import (
    ConflictException,
    UnauthorizedException,
)


class AuthService:
    """Handles authentication business logic."""

    def __init__(self, user_repo: UserRepository | None = None) -> None:
        self._user_repo = user_repo or get_user_repository()

    async def login(self, email: str, password: str, tenant_id: str = None) -> dict:
        """
        Authenticate user and return token pair.
        
        Raises:
            UnauthorizedException: If credentials are invalid.
        """
        # Lookup globally by email first to resolve the workspace
        user = await self._user_repo.get_by_email_global(email)
        if user is None:
            raise UnauthorizedException("Invalid email or password")

        if not verify_password(password, user.hashed_password):
            raise UnauthorizedException("Invalid email or password")

        if not user.is_active:
            raise UnauthorizedException("Account is deactivated. Contact your admin.")

        # Ensure their tenant/workspace is active and not locked
        from backend.app.core.tenant import get_tenant_registry
        registry = get_tenant_registry()
        tenant_config = registry.get_tenant_config(user.tenant_id)
        if not tenant_config or not tenant_config.is_active:
            raise UnauthorizedException("Workspace/Tenant is inactive or locked.")

        return self._generate_tokens(user)

    async def register(self, email: str, password: str, full_name: str,
                       role: str, tenant_id: str, phone: str | None = None) -> dict:
        """
        Create a new user account and return token pair.
        
        Raises:
            ConflictException: If email already exists.
        """
        existing = await self._user_repo.get_by_email(email, tenant_id)
        if existing is not None:
            raise ConflictException(f"User with email '{email}' already exists")

        user = User(
            email=email,
            hashed_password=hash_password(password),
            full_name=full_name,
            role=role,
            tenant_id=tenant_id,
            phone=phone,
        )
        await self._user_repo.create(user)

        # Sync to HRMS employees table
        try:
            from backend.app.repositories.employee_repo import get_employee_repository
            from backend.app.models.employee import Employee
            
            emp_repo = get_employee_repository()
            existing_employees = await emp_repo.get_all(tenant_id, {"email": email}, 0, 1)
            if not existing_employees:
                total_emp = await emp_repo.count(tenant_id)
                next_id = f"EMP-{str(total_emp + 1).zfill(3)}"
                
                role_designation = "Sales Executive"
                dept_name = "Sales"
                if "super" in role.lower() or "admin" in role.lower():
                    role_designation = "Python Developer"
                    dept_name = "Engineering"
                
                employee = Employee(
                    workspace_id=tenant_id,
                    name=full_name,
                    role=role_designation,
                    department=dept_name,
                    email=email,
                    phone=phone,
                    status="Active",
                )
                employee.employee_id = next_id
                await emp_repo.create(employee)
                print(f"[+] Synced register: Created employee {next_id} for user {email}")
        except Exception as e:
            print(f"[!] Syncing employee on register failed: {e}")

        return self._generate_tokens(user)

    async def refresh(self, refresh_token: str) -> dict:
        """
        Validate refresh token and issue a new access token.
        
        Raises:
            UnauthorizedException: If refresh token is invalid/expired.
        """
        payload = decode_token(refresh_token)
        if payload is None or payload.get("type") != "refresh":
            raise UnauthorizedException("Invalid or expired refresh token")

        user_id = payload.get("sub")
        tenant_id = payload.get("tenant_id", "")
        if not user_id:
            raise UnauthorizedException("Invalid token payload")

        user = await self._user_repo.get_by_id(user_id, tenant_id)
        if user is None or not user.is_active:
            raise UnauthorizedException("User not found or inactive")

        return self._generate_tokens(user)

    async def get_profile(self, user_id: str, tenant_id: str) -> dict:
        """
        Retrieve user profile by ID.
        
        Raises:
            UnauthorizedException: If user not found.
        """
        user = await self._user_repo.get_by_id(user_id, tenant_id)
        if user is None:
            raise UnauthorizedException("User not found")
        
        res = user.to_dict()
        
        # Load permissions and role name
        simple_role = user.role
        db_role_id = self._resolve_db_role_id(simple_role, tenant_id)
        permissions = {}
        role_name = "Agent"
        disabled_links = []

        # Super Admin gets full access without DB lookup
        if simple_role == "super_admin":
            role_name = "Super Admin"
            _all_modules = ["dashboard", "crm", "sales", "projects", "whatsapp", "marketing", "automation", "finance", "hrms", "support", "ecommerce", "inventory", "reports", "settings", "users", "audit_logs", "integrations"]
            for m in _all_modules:
                permissions[m] = {"canView": True, "canCreate": True, "canEdit": True, "canDelete": True, "canExport": True, "canImport": True, "canApprove": True, "canAssign": True, "canArchive": True, "recordScope": "all"}
        elif db_role_id:
            from sqlalchemy import text
            from backend.app.core.database import get_db
            try:
                with get_db() as db:
                    # Fetch disabled links: individually unchecked permissions
                    disabled_sql = text("SELECT link FROM workspace_permissions WHERE workspace_id = :ws_id AND can_view = 0")
                    disabled_rows = db.execute(disabled_sql, {"ws_id": tenant_id}).mappings().all()
                    disabled_links = [r["link"] for r in disabled_rows if r["link"]]

                    # Also add ALL links from entirely disabled modules
                    disabled_mods_sql = text("SELECT module FROM workspace_modules WHERE workspace_id = :ws_id AND is_enabled = 0")
                    disabled_mod_rows = db.execute(disabled_mods_sql, {"ws_id": tenant_id}).fetchall()
                    disabled_module_keys = {r[0] for r in disabled_mod_rows}
                    if disabled_module_keys:
                        from backend.app.api.routes.super_admin import FEATURES_BLUEPRINT
                        for mod_key, _feat, link in FEATURES_BLUEPRINT:
                            if mod_key in disabled_module_keys and link and link not in disabled_links:
                                disabled_links.append(link)

                    role_sql = text("SELECT role_name, role_color, status, pages_permissions, buttons_permissions, department_access, branch_access FROM roles WHERE role_id = :role_id AND workspace_id = :workspace_id")
                    r_row = db.execute(role_sql, {"role_id": db_role_id, "workspace_id": tenant_id}).mappings().first()
                    if r_row:
                        role_name = r_row["role_name"]
                        res["role_color"] = r_row.get("role_color")
                        res["role_status"] = r_row.get("status")
                        res["pages_permissions"] = r_row.get("pages_permissions")
                        res["buttons_permissions"] = r_row.get("buttons_permissions")
                        res["department_access"] = r_row.get("department_access")
                        res["branch_access"] = r_row.get("branch_access")

                    if simple_role == "admin":
                        # Organization Admin gets full rights on all enabled modules in workspace_modules
                        enabled_mods_sql = text("SELECT module FROM workspace_modules WHERE workspace_id = :ws_id AND is_enabled = 1")
                        enabled_rows = db.execute(enabled_mods_sql, {"ws_id": tenant_id}).fetchall()
                        for r in enabled_rows:
                            m = r[0]
                            permissions[m] = {
                                "canView": True, "canCreate": True, "canEdit": True, "canDelete": True,
                                "canExport": True, "canImport": True, "canApprove": True, "canAssign": True,
                                "canArchive": True, "recordScope": "all"
                            }
                    else:
                        perm_sql = text("SELECT * FROM role_permissions WHERE role_id = :role_id")
                        rows = db.execute(perm_sql, {"role_id": db_role_id}).mappings().all()
                        for r in rows:
                            permissions[r["module"]] = {
                                "canView": bool(r["can_view"]),
                                "canCreate": bool(r["can_create"]),
                                "canEdit": bool(r["can_edit"]),
                                "canDelete": bool(r["can_delete"]),
                                "canExport": bool(r["can_export"]),
                                "canImport": bool(r["can_import"]),
                                "canApprove": bool(r["can_approve"]),
                                "canAssign": bool(r["can_assign"]),
                                "canArchive": bool(r["can_archive"]),
                                "recordScope": r.get("record_scope") or "all"
                            }
            except Exception as e:
                print(f"[!] Error loading profile permissions: {e}")
        
        res["role_name"] = role_name
        res["permissions"] = permissions
        res["disabled_links"] = disabled_links
        return res

    def _resolve_db_role_id(self, simple_role: str, tenant_id: str) -> str:
        """Translate simple role string back to composite database role_id."""
        if simple_role.startswith("role_"):
            return simple_role  # Already a DB role_id
        # If simple_role is a UUID, return it as is
        try:
            import uuid
            uuid.UUID(simple_role)
            return simple_role
        except ValueError:
            pass
        mapping = {
            "super_admin": f"role_super_admin_{tenant_id}",
            "admin": f"role_admin_001_{tenant_id}",
            "manager": f"role_mgr_001_{tenant_id}",
            "agent": f"role_agent_001_{tenant_id}",
            "support": f"role_support_001_{tenant_id}",
            "finance": f"role_accountant_001_{tenant_id}",
        }
        return mapping.get(simple_role, f"role_{simple_role}_{tenant_id}")

    def _generate_tokens(self, user: User) -> dict:
        """Build access + refresh token pair for a user."""
        settings = get_settings()
        token_data = {"sub": user.id, "email": user.email, "role": user.role, "tenant_id": user.tenant_id}

        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        user_dict = user.to_dict()
        
        # Load permissions and role name
        simple_role = user.role
        db_role_id = self._resolve_db_role_id(simple_role, user.tenant_id)
        permissions = {}
        role_name = "Agent"
        disabled_links = []

        # Super Admin gets full access without DB lookup
        if simple_role == "super_admin":
            role_name = "Super Admin"
            _all_modules = ["dashboard", "crm", "sales", "projects", "whatsapp", "marketing", "automation", "finance", "hrms", "support", "ecommerce", "inventory", "reports", "settings", "users", "audit_logs", "integrations"]
            for m in _all_modules:
                permissions[m] = {"canView": True, "canCreate": True, "canEdit": True, "canDelete": True, "canExport": True, "canImport": True, "canApprove": True, "canAssign": True, "canArchive": True, "recordScope": "all"}
        elif db_role_id:
            from sqlalchemy import text
            from backend.app.core.database import get_db
            try:
                with get_db() as db:
                    # Fetch disabled links: individually unchecked permissions
                    disabled_sql = text("SELECT link FROM workspace_permissions WHERE workspace_id = :ws_id AND can_view = 0")
                    disabled_rows = db.execute(disabled_sql, {"ws_id": user.tenant_id}).mappings().all()
                    disabled_links = [r["link"] for r in disabled_rows if r["link"]]

                    # Also add ALL links from entirely disabled modules
                    disabled_mods_sql = text("SELECT module FROM workspace_modules WHERE workspace_id = :ws_id AND is_enabled = 0")
                    disabled_mod_rows = db.execute(disabled_mods_sql, {"ws_id": user.tenant_id}).fetchall()
                    disabled_module_keys = {r[0] for r in disabled_mod_rows}
                    if disabled_module_keys:
                        from backend.app.api.routes.super_admin import FEATURES_BLUEPRINT
                        for mod_key, _feat, link in FEATURES_BLUEPRINT:
                            if mod_key in disabled_module_keys and link and link not in disabled_links:
                                disabled_links.append(link)

                    role_sql = text("SELECT role_name, role_color, status, pages_permissions, buttons_permissions, department_access, branch_access FROM roles WHERE role_id = :role_id AND workspace_id = :workspace_id")
                    r_row = db.execute(role_sql, {"role_id": db_role_id, "workspace_id": user.tenant_id}).mappings().first()
                    if r_row:
                        role_name = r_row["role_name"]
                        user_dict["role_color"] = r_row.get("role_color")
                        user_dict["role_status"] = r_row.get("status")
                        user_dict["pages_permissions"] = r_row.get("pages_permissions")
                        user_dict["buttons_permissions"] = r_row.get("buttons_permissions")
                        user_dict["department_access"] = r_row.get("department_access")
                        user_dict["branch_access"] = r_row.get("branch_access")

                    if simple_role == "admin":
                        # Organization Admin gets full rights on all enabled modules in workspace_modules
                        enabled_mods_sql = text("SELECT module FROM workspace_modules WHERE workspace_id = :ws_id AND is_enabled = 1")
                        enabled_rows = db.execute(enabled_mods_sql, {"ws_id": user.tenant_id}).fetchall()
                        for r in enabled_rows:
                            m = r[0]
                            permissions[m] = {
                                "canView": True, "canCreate": True, "canEdit": True, "canDelete": True,
                                "canExport": True, "canImport": True, "canApprove": True, "canAssign": True,
                                "canArchive": True, "recordScope": "all"
                            }
                    else:
                        perm_sql = text("SELECT * FROM role_permissions WHERE role_id = :role_id")
                        rows = db.execute(perm_sql, {"role_id": db_role_id}).mappings().all()
                        for r in rows:
                            permissions[r["module"]] = {
                                "canView": bool(r["can_view"]),
                                "canCreate": bool(r["can_create"]),
                                "canEdit": bool(r["can_edit"]),
                                "canDelete": bool(r["can_delete"]),
                                "canExport": bool(r["can_export"]),
                                "canImport": bool(r["can_import"]),
                                "canApprove": bool(r["can_approve"]),
                                "canAssign": bool(r["can_assign"]),
                                "canArchive": bool(r["can_archive"]),
                                "recordScope": r.get("record_scope") or "all"
                            }
            except Exception as e:
                print(f"[!] Error loading profile permissions in generate_tokens: {e}")
        
        user_dict["role_name"] = role_name
        user_dict["permissions"] = permissions
        user_dict["disabled_links"] = disabled_links

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.JWT_ACCESS_EXPIRE_MINUTES * 60,
            "user": user_dict,
        }


# Singleton instance
_auth_service = AuthService()

def get_auth_service() -> AuthService:
    return _auth_service
