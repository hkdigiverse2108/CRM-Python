"""
Workspace Admin Console Routes
==============================
CRUD and configuration endpoints scoped strictly to the current workspace.
Only accessible by Organization Admins (admin_001) or Super Admins.
"""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import text

from backend.app.api.dependencies.auth import get_current_user
from backend.app.core.database import get_db
from backend.app.core.security import hash_password
from backend.app.utils.response import success_response

router = APIRouter()

# Allowed 18 roles list
ALLOWED_ROLES_MAP = {
    "Super Admin": "super_admin",
    "Organization Admin": "admin_001",
    "Sales Manager": "mgr_001",
    "Sales Executive": "agent_001",
    "Marketing Manager": "marketing_mgr",
    "Marketing Executive": "marketing_exec",
    "HR Manager": "hr_mgr",
    "HR Executive": "hr_exec",
    "Accountant": "accountant_001",
    "Support Manager": "support_mgr",
    "Support Executive": "support_001",
    "Project Manager": "project_mgr",
    "Team Member": "team_member",
    "Operations Manager": "operations_mgr",
    "Inventory Manager": "inventory_mgr",
    "Call Center Agent": "call_center_agent",
    "WhatsApp Agent": "whatsapp_agent",
    "Receptionist": "receptionist"
}

# Reverse map for UI translation
SUFFIX_TO_ROLE_MAP = {v: k for k, v in ALLOWED_ROLES_MAP.items()}

# Request schemas
class UserCreatePayload(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    role_name: Optional[str] = "Employee"
    password: str = Field(..., min_length=6, max_length=50)
    phone: Optional[str] = Field(None, max_length=20)
    reporting_manager: Optional[str] = Field(None, max_length=100)
    salary: Optional[float] = 0.0

class UserUpdatePayload(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    role_name: Optional[str] = None
    department: Optional[str] = None
    reporting_manager: Optional[str] = Field(None, max_length=100)
    salary: Optional[float] = 0.0

class PasswordResetPayload(BaseModel):
    password: str = Field(..., min_length=6, max_length=50)

class WorkspaceSettingsPayload(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=100)
    custom_domain: Optional[str] = Field(None, max_length=255)
    logo_url: Optional[str] = Field(None, max_length=500)
    brand_color: Optional[str] = Field(None, max_length=50)
    company_address: Optional[str] = None
    company_gstin: Optional[str] = Field(None, max_length=100)
    company_docs: Optional[str] = None
    working_days: Optional[int] = 26
    login_greeting: Optional[str] = "Enterprise multi-tenant customer relationship hub"
    shift_start: Optional[str] = "09:00 AM"
    shift_end: Optional[str] = "06:00 PM"
    company_pan: Optional[str] = None
    break_duration: Optional[int] = 60
    break_start: Optional[str] = "01:00 PM"
    break_end: Optional[str] = "02:00 PM"
    saturdays_off: Optional[str] = "2,4"


class UserPermissionsUpdatePayload(BaseModel):
    pages_permissions: List[str]
    buttons_permissions: List[str]
    department_access: List[str]
    branch_access: str
    permissions: List[dict]

class PermissionItemPayload(BaseModel):
    module: str
    feature: str
    link: Optional[str] = None
    can_add: int
    can_edit: int
    can_delete: int
    can_view: int
    can_full: int

class PermissionsBulkPayload(BaseModel):
    modules_status: dict  # module name -> is_enabled bool
    permissions: List[PermissionItemPayload]

# Middleware dependency
def require_workspace_admin(current_user: dict = Depends(get_current_user)):
    role_name = current_user.get("role_name", "")
    role_id = current_user.get("role", "")
    
    is_org_admin = role_name in ("Workspace Admin", "Organization Admin") or role_id == "admin" or "admin_001" in role_id
    is_super_admin = role_name == "Super Admin" or "super_admin" in role_id
    
    if not (is_org_admin or is_super_admin):
        raise HTTPException(status_code=403, detail="Access denied. Workspace Admin privileges required.")
    return current_user

def log_audit_event(db, workspace_id: str, user_id: str, email: str, action: str, details: str, ip: Optional[str] = None):
    sql = text("""
        INSERT INTO audit_logs (log_id, workspace_id, user_id, user_email, action, details, ip_address)
        VALUES (:log_id, :workspace_id, :user_id, :email, :action, :details, :ip)
    """)
    db.execute(sql, {
        "log_id": str(uuid.uuid4()),
        "workspace_id": workspace_id,
        "user_id": user_id,
        "email": email,
        "action": action,
        "details": details,
        "ip": ip
    })

# 1. User Management Endpoints
@router.get("/users")
async def list_workspace_users(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None, max_length=100),
    current_user: dict = Depends(require_workspace_admin)
):
    workspace_id = current_user.get("tenant_id") or current_user.get("workspace_id")
    offset = (page - 1) * per_page
    
    with get_db() as db:
        if search:
            # Using ft_users FULLTEXT search
            users_query = text("""
                SELECT u.user_id, u.email, u.full_name, u.phone, u.status, u.role_id, u.created_at, r.role_name, e.employee_id, e.department, e.reporting_manager, e.salary_structure
                FROM users u
                LEFT JOIN roles r ON u.role_id = r.role_id
                LEFT JOIN hrms_employees e ON u.email = e.email AND e.workspace_id = u.workspace_id AND e.deleted_at IS NULL
                WHERE u.workspace_id = :workspace_id AND u.deleted_at IS NULL
                  AND MATCH(u.full_name, u.email, u.phone) AGAINST(:search IN NATURAL LANGUAGE MODE)
                LIMIT :limit OFFSET :offset
            """)
            count_query = text("""
                SELECT COUNT(*)
                FROM users u
                WHERE u.workspace_id = :workspace_id AND u.deleted_at IS NULL
                  AND MATCH(u.full_name, u.email, u.phone) AGAINST(:search IN NATURAL LANGUAGE MODE)
            """)
            params = {"workspace_id": workspace_id, "search": search, "limit": per_page, "offset": offset}
        else:
            users_query = text("""
                SELECT u.user_id, u.email, u.full_name, u.phone, u.status, u.role_id, u.created_at, r.role_name, e.employee_id, e.department, e.reporting_manager, e.salary_structure
                FROM users u
                LEFT JOIN roles r ON u.role_id = r.role_id
                LEFT JOIN hrms_employees e ON u.email = e.email AND e.workspace_id = u.workspace_id AND e.deleted_at IS NULL
                WHERE u.workspace_id = :workspace_id AND u.deleted_at IS NULL
                LIMIT :limit OFFSET :offset
            """)
            count_query = text("""
                SELECT COUNT(*)
                FROM users u
                WHERE u.workspace_id = :workspace_id AND u.deleted_at IS NULL
            """)
            params = {"workspace_id": workspace_id, "limit": per_page, "offset": offset}

        rows = db.execute(users_query, params).mappings().all()
        total = db.execute(count_query, {"workspace_id": workspace_id, "search": search} if search else {"workspace_id": workspace_id}).scalar() or 0

        import json
        users_list = []
        for r in rows:
            sal_struct = {}
            if r["salary_structure"]:
                try:
                    sal_struct = json.loads(r["salary_structure"]) if isinstance(r["salary_structure"], str) else r["salary_structure"]
                except:
                    pass
            basic_sal = float(sal_struct.get("basic") or 0.0)

            users_list.append({
                "user_id": r["user_id"],
                "email": r["email"],
                "full_name": r["full_name"],
                "phone": r["phone"],
                "status": r["status"],
                "role_name": r["role_name"] or "Custom Role",
                "employee_id": r["employee_id"],
                "department": r["department"],
                "reporting_manager": r["reporting_manager"],
                "salary": basic_sal,
                "created_at": r["created_at"].isoformat() if r["created_at"] else None
            })

        return success_response(
            data=users_list,
            message="Workspace users retrieved successfully",
            meta={
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": (total + per_page - 1) // per_page if total > 0 else 0
            }
        )

@router.post("/users")
async def create_workspace_user(
    payload: UserCreatePayload,
    request: Request,
    current_user: dict = Depends(require_workspace_admin)
):
    workspace_id = current_user.get("tenant_id") or current_user.get("workspace_id")
    ip = request.client.host if request.client else None
    
    new_user_id = str(uuid.uuid4())
    is_org_admin = payload.role_name == "Organization Admin"
    db_role_id = f"role_admin_001_{workspace_id}" if is_org_admin else new_user_id

    with get_db() as db:
        # Check email uniqueness (including soft-deleted)
        existing_user = db.execute(text("""
            SELECT user_id, deleted_at, role_id FROM users 
            WHERE email = :email AND workspace_id = :ws_id
        """), {"email": payload.email, "ws_id": workspace_id}).mappings().first()
        
        if existing_user:
            if existing_user["deleted_at"] is None:
                raise HTTPException(status_code=400, detail="Email is already in use within this workspace.")
            else:
                # The user was soft-deleted. Let's permanently clean them and their role first to avoid unique constraint error
                old_role_id = existing_user["role_id"]
                db.execute(text("DELETE FROM users WHERE user_id = :uid"), {"uid": existing_user["user_id"]})
                if old_role_id:
                    db.execute(text("DELETE FROM role_permissions WHERE role_id = :role_id"), {"role_id": old_role_id})
                    db.execute(text("DELETE FROM roles WHERE role_id = :role_id AND workspace_id = :ws_id"), {"role_id": old_role_id, "ws_id": workspace_id})

        # Validate workspace limits
        max_users = db.execute(text("SELECT max_users FROM workspaces WHERE workspace_id = :ws_id"), {"ws_id": workspace_id}).scalar()
        if max_users is not None:
            current_users = db.execute(text("SELECT COUNT(*) FROM users WHERE workspace_id = :ws_id AND deleted_at IS NULL"), {"ws_id": workspace_id}).scalar() or 0
            if current_users >= max_users:
                raise HTTPException(status_code=400, detail=f"User limit reached. Your workspace is restricted to {max_users} users.")

        if not is_org_admin:
            # Check if there is an existing role in the workspace matching payload.role_name
            existing_role = db.execute(text("""
                SELECT role_id, pages_permissions, buttons_permissions, department_access, branch_access 
                FROM roles 
                WHERE role_name = :role_name AND workspace_id = :ws_id
            """), {"role_name": payload.role_name, "ws_id": workspace_id}).mappings().first()
            
            if existing_role:
                # Copy from existing role
                db.execute(text("""
                    INSERT INTO roles (role_id, workspace_id, role_name, description, is_custom, status, pages_permissions, buttons_permissions, department_access, branch_access)
                    VALUES (:role_id, :ws_id, :role_name, :desc, 1, 'active', :pages, :buttons, :dept, :branch)
                """), {
                    "role_id": db_role_id,
                    "ws_id": workspace_id,
                    "role_name": f"Role for {payload.full_name}",
                    "desc": f"User-specific custom role cloned from {payload.role_name} for {payload.full_name} ({payload.email})",
                    "pages": existing_role["pages_permissions"] or "[]",
                    "buttons": existing_role["buttons_permissions"] or "[]",
                    "dept": existing_role["department_access"] or "[]",
                    "branch": existing_role["branch_access"] or "all"
                })
                
                # Copy module permissions
                existing_perms = db.execute(text("""
                    SELECT module, can_view, can_create, can_edit, can_delete, can_export, can_import, can_approve, can_assign, can_archive, record_scope
                    FROM role_permissions WHERE role_id = :role_id
                """), {"role_id": existing_role["role_id"]}).mappings().all()
                
                for r in existing_perms:
                    rp_id = str(uuid.uuid4())
                    db.execute(text("""
                        INSERT INTO role_permissions (id, role_id, module, can_view, can_create, can_edit, can_delete, can_export, can_import, can_approve, can_assign, can_archive, record_scope)
                        VALUES (:id, :role_id, :module, :view, :create, :edit, :delete, :export, :import, :approve, :assign, :archive, :scope)
                    """), {
                        "id": rp_id, "role_id": db_role_id, "module": r["module"],
                        "view": r["can_view"], "create": r["can_create"], "edit": r["can_edit"], "delete": r["can_delete"],
                        "export": r["can_export"], "import": r["can_import"], "approve": r["can_approve"], "assign": r["can_assign"],
                        "archive": r["can_archive"], "scope": r["record_scope"]
                    })
            else:
                # Create user-specific custom role (fallback/default empty role)
                db.execute(text("""
                    INSERT INTO roles (role_id, workspace_id, role_name, description, is_custom, status, pages_permissions, buttons_permissions)
                    VALUES (:role_id, :ws_id, :role_name, :desc, 1, 'active', '[]', '[]')
                """), {
                    "role_id": db_role_id,
                    "ws_id": workspace_id,
                    "role_name": f"Role for {payload.full_name}",
                    "desc": f"User-specific custom role for {payload.full_name} ({payload.email})"
                })

                # Seed default module permissions (view-only for all enabled workspace modules)
                active_modules_sql = text("""
                    SELECT DISTINCT module FROM workspace_modules WHERE workspace_id = :ws_id AND is_enabled = 1
                """)
                active_modules = db.execute(active_modules_sql, {"ws_id": workspace_id}).fetchall()
                
                for (mod,) in active_modules:
                    rp_id = str(uuid.uuid4())
                    db.execute(text("""
                        INSERT INTO role_permissions (id, role_id, module, can_view, can_create, can_edit, can_delete, can_export, can_import, can_approve, can_assign, can_archive, record_scope)
                        VALUES (:id, :role_id, :module, 1, 0, 0, 0, 0, 0, 0, 0, 0, 'all')
                    """), {
                        "id": rp_id,
                        "role_id": db_role_id,
                        "module": mod
                    })

        hashed = hash_password(payload.password)
        
        insert_sql = text("""
            INSERT INTO users (user_id, workspace_id, role_id, full_name, email, phone, password_hash, status)
            VALUES (:uid, :ws_id, :role_id, :name, :email, :phone, :hashed, 'active')
        """)
        db.execute(insert_sql, {
            "uid": new_user_id,
            "ws_id": workspace_id,
            "role_id": db_role_id,
            "name": payload.full_name,
            "email": payload.email,
            "phone": payload.phone,
            "hashed": hashed
        })

        # Sync/Create employee record in hrms_employees table
        existing_emp = db.execute(text("""
            SELECT employee_id FROM hrms_employees WHERE email = :email AND workspace_id = :ws_id
        """), {"email": payload.email, "ws_id": workspace_id}).scalar()

        role_designation = payload.role_name or "Sales Executive"
        dept_name = "Sales"
        rd_lower = role_designation.lower()
        if "super" in rd_lower or "admin" in rd_lower:
            role_designation = "Python Developer"
            dept_name = "Engineering"
        elif "hr" in rd_lower:
            dept_name = "HR"
        elif "marketing" in rd_lower:
            dept_name = "Marketing"
        elif "finance" in rd_lower or "account" in rd_lower:
            dept_name = "Finance"
        elif "support" in rd_lower:
            dept_name = "Support"

        import json
        salary_structure = {
            "basic": float(payload.salary or 0.0),
            "hra": 0.0,
            "allowances": 0.0,
            "incentives": 0.0,
            "bonus": 0.0,
            "pf": 0.0,
            "esi": 0.0,
            "tds": 0.0,
            "loanDeductions": 0.0
        }

        if not existing_emp:
            emp_id = f"EMP-{str(uuid.uuid4())[:6].upper()}"
            insert_emp_sql = text("""
                INSERT INTO hrms_employees (employee_id, workspace_id, name, role, department, email, phone, status, reporting_manager, join_date, salary_structure)
                VALUES (:emp_id, :ws_id, :name, :role, :department, :email, :phone, 'Active', :reporting_manager, CURRENT_DATE, :salary_structure)
            """)
            db.execute(insert_emp_sql, {
                "emp_id": emp_id,
                "ws_id": workspace_id,
                "name": payload.full_name,
                "role": role_designation,
                "department": dept_name,
                "email": payload.email,
                "phone": payload.phone,
                "reporting_manager": payload.reporting_manager,
                "salary_structure": json.dumps(salary_structure)
            })
        else:
            # Preserving other fields of existing salary structure if present
            sal_struct = {}
            if existing_emp:
                emp_row = db.execute(text("SELECT salary_structure FROM hrms_employees WHERE employee_id = :emp_id"), {"emp_id": existing_emp}).mappings().first()
                if emp_row and emp_row["salary_structure"]:
                    try:
                        sal_struct = json.loads(emp_row["salary_structure"]) if isinstance(emp_row["salary_structure"], str) else emp_row["salary_structure"]
                    except:
                        pass
            sal_struct["basic"] = float(payload.salary or 0.0)

            update_emp_sql = text("""
                UPDATE hrms_employees 
                SET reporting_manager = :reporting_manager, role = :role, department = :department, name = :name, phone = :phone, salary_structure = :salary_structure, deleted_at = NULL
                WHERE employee_id = :emp_id
            """)
            db.execute(update_emp_sql, {
                "reporting_manager": payload.reporting_manager,
                "role": role_designation,
                "department": dept_name,
                "name": payload.full_name,
                "phone": payload.phone,
                "salary_structure": json.dumps(sal_struct),
                "emp_id": existing_emp
            })
        
        log_audit_event(
            db, workspace_id, current_user["id"], current_user["email"],
            "CREATE_USER", f"Created user {payload.email} with role {payload.role_name}", ip
        )
        db.commit()

    return success_response(
        data={"user_id": new_user_id, "full_name": payload.full_name, "email": payload.email},
        message="User created successfully",
        status_code=201
    )

@router.put("/users/{user_id}/details")
async def update_workspace_user_details(
    user_id: str,
    payload: UserUpdatePayload,
    request: Request,
    current_user: dict = Depends(require_workspace_admin)
):
    workspace_id = current_user.get("tenant_id") or current_user.get("workspace_id")
    ip = request.client.host if request.client else None

    with get_db() as db:
        # Verify user exists and belongs to workspace
        user_row = db.execute(text("""
            SELECT email, role_id, full_name FROM users 
            WHERE user_id = :uid AND workspace_id = :ws_id AND deleted_at IS NULL
        """), {"uid": user_id, "ws_id": workspace_id}).mappings().first()
        if not user_row:
            raise HTTPException(status_code=404, detail="User not found in this workspace.")

        # Check email uniqueness if it changed
        if payload.email != user_row["email"]:
            email_check = db.execute(text("""
                SELECT user_id FROM users 
                WHERE email = :email AND workspace_id = :ws_id AND deleted_at IS NULL AND user_id != :uid
            """), {"email": payload.email, "ws_id": workspace_id, "uid": user_id}).scalar()
            if email_check:
                raise HTTPException(status_code=400, detail="Email is already in use by another user in this workspace.")

        # Update users table
        db.execute(text("""
            UPDATE users 
            SET email = :email, full_name = :name, phone = :phone
            WHERE user_id = :uid AND workspace_id = :ws_id
        """), {
            "email": payload.email,
            "name": payload.full_name,
            "phone": payload.phone,
            "uid": user_id,
            "ws_id": workspace_id
        })

        # Update or create hrms_employees record
        existing_emp = db.execute(text("""
            SELECT employee_id FROM hrms_employees WHERE email = :email AND workspace_id = :ws_id
        """), {"email": user_row["email"], "ws_id": workspace_id}).scalar()

        if not existing_emp:
            # Check if there is one with the new email
            existing_emp = db.execute(text("""
                SELECT employee_id FROM hrms_employees WHERE email = :email AND workspace_id = :ws_id
            """), {"email": payload.email, "ws_id": workspace_id}).scalar()

        import json
        role_designation = payload.role_name or "Sales Executive"
        dept_name = payload.department or "Sales"

        # Preserving other fields of existing salary structure if present
        sal_struct = {}
        if existing_emp:
            emp_row = db.execute(text("SELECT salary_structure FROM hrms_employees WHERE employee_id = :emp_id"), {"emp_id": existing_emp}).mappings().first()
            if emp_row and emp_row["salary_structure"]:
                try:
                    sal_struct = json.loads(emp_row["salary_structure"]) if isinstance(emp_row["salary_structure"], str) else emp_row["salary_structure"]
                except:
                    pass
        sal_struct["basic"] = float(payload.salary or 0.0)

        if not existing_emp:
            emp_id = f"EMP-{str(uuid.uuid4())[:6].upper()}"
            db.execute(text("""
                INSERT INTO hrms_employees (employee_id, workspace_id, name, role, department, email, phone, status, reporting_manager, join_date, salary_structure)
                VALUES (:emp_id, :ws_id, :name, :role, :department, :email, :phone, 'Active', :reporting_manager, CURRENT_DATE, :salary_structure)
            """), {
                "emp_id": emp_id,
                "ws_id": workspace_id,
                "name": payload.full_name,
                "role": role_designation,
                "department": dept_name,
                "email": payload.email,
                "phone": payload.phone,
                "reporting_manager": payload.reporting_manager,
                "salary_structure": json.dumps(sal_struct)
            })
        else:
            db.execute(text("""
                UPDATE hrms_employees 
                SET name = :name, email = :email, phone = :phone, role = :role, department = :department, reporting_manager = :reporting_manager, salary_structure = :salary_structure
                WHERE employee_id = :emp_id
            """), {
                "name": payload.full_name,
                "email": payload.email,
                "phone": payload.phone,
                "role": role_designation,
                "department": dept_name,
                "reporting_manager": payload.reporting_manager,
                "salary_structure": json.dumps(sal_struct),
                "emp_id": existing_emp
            })

        log_audit_event(
            db, workspace_id, current_user["id"], current_user["email"],
            "UPDATE_USER_DETAILS", f"Updated details for user {payload.email}", ip
        )
        db.commit()

    return success_response(message="User details updated successfully")

@router.put("/users/{user_id}/password")
async def change_user_password(
    user_id: str,
    payload: PasswordResetPayload,
    request: Request,
    current_user: dict = Depends(require_workspace_admin)
):
    workspace_id = current_user.get("tenant_id") or current_user.get("workspace_id")
    ip = request.client.host if request.client else None

    with get_db() as db:
        # Verify user belongs to workspace
        user_exists = db.execute(text("SELECT email FROM users WHERE user_id = :uid AND workspace_id = :ws_id AND deleted_at IS NULL"), {"uid": user_id, "ws_id": workspace_id}).mappings().first()
        if not user_exists:
            raise HTTPException(status_code=404, detail="User not found in this workspace.")

        hashed = hash_password(payload.password)
        db.execute(text("UPDATE users SET password_hash = :hashed WHERE user_id = :uid"), {"hashed": hashed, "uid": user_id})
        
        log_audit_event(
            db, workspace_id, current_user["id"], current_user["email"],
            "RESET_PASSWORD", f"Reset password for user {user_exists['email']}", ip
        )
        db.commit()

    return success_response(message="Password reset successfully.")

@router.delete("/users/{user_id}")
async def delete_workspace_user(
    user_id: str,
    request: Request,
    current_user: dict = Depends(require_workspace_admin)
):
    workspace_id = current_user.get("tenant_id") or current_user.get("workspace_id")
    ip = request.client.host if request.client else None

    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account.")

    with get_db() as db:
        user_exists = db.execute(text("SELECT email FROM users WHERE user_id = :uid AND workspace_id = :ws_id AND deleted_at IS NULL"), {"uid": user_id, "ws_id": workspace_id}).mappings().first()
        if not user_exists:
            raise HTTPException(status_code=404, detail="User not found in this workspace.")

        db.execute(text("UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE user_id = :uid"), {"uid": user_id})
        
        log_audit_event(
            db, workspace_id, current_user["id"], current_user["email"],
            "DELETE_USER", f"Soft-deleted user {user_exists['email']}", ip
        )
        db.commit()

    return success_response(message="User deleted successfully.")

# 2. Workspace Roles Summary
@router.get("/roles-summary")
async def roles_summary(current_user: dict = Depends(require_workspace_admin)):
    workspace_id = current_user.get("tenant_id") or current_user.get("workspace_id")
    with get_db() as db:
        sql = text("""
            SELECT r.role_name, COUNT(u.user_id) as user_count 
            FROM roles r
            LEFT JOIN users u ON u.role_id = r.role_id AND u.deleted_at IS NULL
            WHERE r.workspace_id = :ws_id
            GROUP BY r.role_id, r.role_name
        """)
        rows = db.execute(sql, {"ws_id": workspace_id}).mappings().all()
        summary = [{"role_name": r["role_name"], "user_count": r["user_count"]} for r in rows]
        return success_response(data=summary)

# 3. Permissions Matrix Endpoints
@router.get("/permissions")
async def get_workspace_permissions(current_user: dict = Depends(require_workspace_admin)):
    workspace_id = current_user.get("tenant_id") or current_user.get("workspace_id")
    with get_db() as db:
        # Import blueprints inline to avoid circular imports
        from backend.app.api.routes.super_admin import FEATURES_BLUEPRINT
        
        # 1. Seed missing modules in workspace_modules
        allowed_modules = [
            "dashboard", "crm", "sales", "whatsapp", "marketing", "automation",
            "finance", "hrms", "support", "projects", "reports", "settings",
            "users", "audit_logs", "integrations", "ecommerce", "inventory"
        ]
        for m in allowed_modules:
            exist_m = db.execute(text("SELECT 1 FROM workspace_modules WHERE workspace_id = :ws_id AND module = :module"), {"ws_id": workspace_id, "module": m}).scalar()
            if not exist_m:
                db.execute(text("""
                    INSERT INTO workspace_modules (workspace_id, module, is_enabled, updated_by)
                    VALUES (:ws_id, :module, 1, :uid)
                """), {"ws_id": workspace_id, "module": m, "uid": current_user["id"]})

        # 2. Seed missing features in workspace_permissions
        for module, feature, link in FEATURES_BLUEPRINT:
            exist_check = db.execute(text("""
                SELECT 1 FROM workspace_permissions 
                WHERE workspace_id = :ws_id AND module = :module AND feature = :feature
            """), {"ws_id": workspace_id, "module": module, "feature": feature}).scalar()
            
            if not exist_check:
                db.execute(text("""
                    INSERT INTO workspace_permissions 
                    (workspace_id, module, feature, link, can_add, can_edit, can_delete, can_view, can_full)
                    VALUES (:ws_id, :module, :feature, :link, 1, 1, 1, 1, 1)
                """), {"ws_id": workspace_id, "module": module, "feature": feature, "link": link})
        db.commit()

        # Modules state
        modules_sql = text("SELECT module, is_enabled FROM workspace_modules WHERE workspace_id = :ws_id")
        modules_rows = db.execute(modules_sql, {"ws_id": workspace_id}).mappings().all()
        modules_status = {r["module"]: bool(r["is_enabled"]) for r in modules_rows}

        # Features list
        perm_sql = text("""
            SELECT module, feature, link, can_add, can_edit, can_delete, can_view, can_full
            FROM workspace_permissions
            WHERE workspace_id = :ws_id
        """)
        perm_rows = db.execute(perm_sql, {"ws_id": workspace_id}).mappings().all()
        
        permissions = [{
            "module": r["module"],
            "feature": r["feature"],
            "link": r["link"],
            "can_add": int(r["can_add"]),
            "can_edit": int(r["can_edit"]),
            "can_delete": int(r["can_delete"]),
            "can_view": int(r["can_view"]),
            "can_full": int(r["can_full"])
        } for r in perm_rows]

        return success_response(data={
            "modules_status": modules_status,
            "permissions": permissions
        })

@router.put("/permissions")
async def update_workspace_permissions(
    payload: PermissionsBulkPayload,
    request: Request,
    current_user: dict = Depends(require_workspace_admin)
):
    workspace_id = current_user.get("tenant_id") or current_user.get("workspace_id")
    ip = request.client.host if request.client else None

    with get_db() as db:
        # 1. Update workspace modules enabled statuses
        for module, is_enabled in payload.modules_status.items():
            exist_check = db.execute(text("SELECT 1 FROM workspace_modules WHERE workspace_id = :ws_id AND module = :module"), {"ws_id": workspace_id, "module": module}).scalar()
            if exist_check:
                db.execute(text("""
                    UPDATE workspace_modules 
                    SET is_enabled = :is_enabled, updated_by = :user_id 
                    WHERE workspace_id = :ws_id AND module = :module
                """), {"is_enabled": 1 if is_enabled else 0, "user_id": current_user["id"], "ws_id": workspace_id, "module": module})
            else:
                db.execute(text("""
                    INSERT INTO workspace_modules (workspace_id, module, is_enabled, updated_by)
                    VALUES (:ws_id, :module, :is_enabled, :user_id)
                """), {"is_enabled": 1 if is_enabled else 0, "user_id": current_user["id"], "ws_id": workspace_id, "module": module})

        # 2. Update feature permissions
        for perm in payload.permissions:
            exist_perm = db.execute(text("""
                SELECT 1 FROM workspace_permissions 
                WHERE workspace_id = :ws_id AND module = :module AND feature = :feature
            """), {"ws_id": workspace_id, "module": perm.module, "feature": perm.feature}).scalar()

            if exist_perm:
                db.execute(text("""
                    UPDATE workspace_permissions
                    SET can_add = :can_add, can_edit = :can_edit, can_delete = :can_delete, 
                        can_view = :can_view, can_full = :can_full, updated_by = :user_id
                    WHERE workspace_id = :ws_id AND module = :module AND feature = :feature
                """), {
                    "can_add": perm.can_add, "can_edit": perm.can_edit, "can_delete": perm.can_delete,
                    "can_view": perm.can_view, "can_full": perm.can_full, "user_id": current_user["id"],
                    "ws_id": workspace_id, "module": perm.module, "feature": perm.feature
                })
            else:
                db.execute(text("""
                    INSERT INTO workspace_permissions 
                    (workspace_id, module, feature, link, can_add, can_edit, can_delete, can_view, can_full, updated_by)
                    VALUES (:ws_id, :module, :feature, :link, :can_add, :can_edit, :can_delete, :can_view, :can_full, :user_id)
                """), {
                    "ws_id": workspace_id, "module": perm.module, "feature": perm.feature, "link": perm.link,
                    "can_add": perm.can_add, "can_edit": perm.can_edit, "can_delete": perm.can_delete,
                    "can_view": perm.can_view, "can_full": perm.can_full, "user_id": current_user["id"]
                })

        log_audit_event(
            db, workspace_id, current_user["id"], current_user["email"],
            "UPDATE_PERMISSIONS", "Updated workspace modules status and granular permissions matrix.", ip
        )
        db.commit()

    return success_response(message="Workspace permissions updated successfully.")

# 4. User-Specific Permissions Endpoints
@router.get("/users/{user_id}/permissions")
async def get_user_permissions(
    user_id: str,
    current_user: dict = Depends(require_workspace_admin)
):
    workspace_id = current_user.get("tenant_id") or current_user.get("workspace_id")
    with get_db() as db:
        user_row = db.execute(text("""
            SELECT role_id, full_name, email FROM users 
            WHERE user_id = :uid AND workspace_id = :ws_id AND deleted_at IS NULL
        """), {"uid": user_id, "ws_id": workspace_id}).mappings().first()
        
        if not user_row:
            raise HTTPException(status_code=404, detail="User not found")
            
        role_id = user_row["role_id"]
        
        role_row = db.execute(text("""
            SELECT role_name, pages_permissions, buttons_permissions, department_access, branch_access 
            FROM roles WHERE role_id = :role_id AND workspace_id = :ws_id
        """), {"role_id": role_id, "ws_id": workspace_id}).mappings().first()
        
        if not role_row:
            raise HTTPException(status_code=404, detail="Role not found for user")
            
        import json
        pages = []
        if role_row["pages_permissions"]:
            try:
                pages = json.loads(role_row["pages_permissions"])
            except:
                pages = []
                
        buttons = []
        if role_row["buttons_permissions"]:
            try:
                buttons = json.loads(role_row["buttons_permissions"])
            except:
                buttons = []
                
        departments = []
        if role_row["department_access"]:
            try:
                departments = json.loads(role_row["department_access"])
            except:
                departments = []
                
        perm_rows = db.execute(text("""
            SELECT module, can_view, can_create, can_edit, can_delete, can_export, can_import, can_approve, can_assign, can_archive, record_scope
            FROM role_permissions WHERE role_id = :role_id
        """), {"role_id": role_id}).mappings().all()
        
        permissions = [{
            "module": r["module"],
            "canView": bool(r["can_view"]),
            "canCreate": bool(r["can_create"]),
            "canEdit": bool(r["can_edit"]),
            "canDelete": bool(r["can_delete"]),
            "canExport": bool(r["can_export"]),
            "canImport": bool(r["can_import"]),
            "canApprove": bool(r["can_approve"]),
            "canAssign": bool(r["can_assign"]),
            "canArchive": bool(r["can_archive"]),
            "recordScope": r["record_scope"] or "all"
        } for r in perm_rows]
        
        return success_response(data={
            "user_id": user_id,
            "full_name": user_row["full_name"],
            "email": user_row["email"],
            "role_id": role_id,
            "role_name": role_row["role_name"],
            "pages_permissions": pages,
            "buttons_permissions": buttons,
            "department_access": departments,
            "branch_access": role_row["branch_access"] or "all",
            "permissions": permissions
        })

@router.put("/users/{user_id}/permissions")
async def update_user_permissions(
    user_id: str,
    payload: UserPermissionsUpdatePayload,
    current_user: dict = Depends(require_workspace_admin)
):
    workspace_id = current_user.get("tenant_id") or current_user.get("workspace_id")
    with get_db() as db:
        user_row = db.execute(text("""
            SELECT role_id FROM users 
            WHERE user_id = :uid AND workspace_id = :ws_id AND deleted_at IS NULL
        """), {"uid": user_id, "ws_id": workspace_id}).mappings().first()
        
        if not user_row:
            raise HTTPException(status_code=404, detail="User not found")
            
        role_id = user_row["role_id"]
        
        import json
        db.execute(text("""
            UPDATE roles 
            SET pages_permissions = :pages, 
                buttons_permissions = :buttons, 
                department_access = :dept, 
                branch_access = :branch
            WHERE role_id = :role_id AND workspace_id = :ws_id
        """), {
            "pages": json.dumps(payload.pages_permissions),
            "buttons": json.dumps(payload.buttons_permissions),
            "dept": json.dumps(payload.department_access),
            "branch": payload.branch_access,
            "role_id": role_id,
            "ws_id": workspace_id
        })
        
        # Auto-enable module view permissions if any sub-pages are checked
        permissions_dict = {p.get("module"): p for p in payload.permissions if p.get("module")}
        for pk in payload.pages_permissions:
            mod = "dashboard" if pk == "crm_dashboard" else (pk.split("_")[0] if "_" in pk else None)
            if mod:
                if mod in permissions_dict:
                    permissions_dict[mod]["canView"] = True
                else:
                    permissions_dict[mod] = {
                        "module": mod,
                        "canView": True,
                        "canCreate": False,
                        "canEdit": False,
                        "canDelete": False,
                        "canExport": False,
                        "canImport": False,
                        "canApprove": False,
                        "canAssign": False,
                        "canArchive": False,
                        "recordScope": "all"
                    }
        
        db.execute(text("DELETE FROM role_permissions WHERE role_id = :role_id"), {"role_id": role_id})
        
        for p in permissions_dict.values():
            rp_id = str(uuid.uuid4())
            db.execute(text("""
                INSERT INTO role_permissions (
                    id, role_id, module, can_view, can_create, can_edit, can_delete, 
                    can_export, can_import, can_approve, can_assign, can_archive, record_scope
                ) VALUES (
                    :id, :role_id, :module, :view, :create, :edit, :delete, 
                    :export, :import, :approve, :assign, :archive, :scope
                )
            """), {
                "id": rp_id,
                "role_id": role_id,
                "module": p["module"],
                "view": 1 if p.get("canView") else 0,
                "create": 1 if p.get("canCreate") else 0,
                "edit": 1 if p.get("canEdit") else 0,
                "delete": 1 if p.get("canDelete") else 0,
                "export": 1 if p.get("canExport") else 0,
                "import": 1 if p.get("canImport") else 0,
                "approve": 1 if p.get("canApprove") else 0,
                "assign": 1 if p.get("canAssign") else 0,
                "archive": 1 if p.get("canArchive") else 0,
                "scope": p.get("recordScope") or "all"
            })
            
        db.commit()
        
    return success_response(message="User permissions updated successfully")

@router.get("/settings")
async def get_workspace_settings(current_user: dict = Depends(get_current_user)):
    workspace_id = current_user.get("tenant_id") or current_user.get("workspace_id")
    with get_db() as db:
        row = db.execute(text("""
            SELECT workspace_name, custom_domain, logo_url, brand_color, company_address, company_gstin, company_docs, working_days,
                   login_greeting, shift_start, shift_end, company_pan, break_duration, break_start, break_end, saturdays_off
            FROM workspaces WHERE workspace_id = :ws_id
        """), {"ws_id": workspace_id}).mappings().first()
        
        if not row:
            raise HTTPException(status_code=404, detail="Workspace settings not found.")
            
        return success_response(data={
            "company_name": row["workspace_name"],
            "custom_domain": row["custom_domain"],
            "logo_url": row["logo_url"],
            "brand_color": row["brand_color"],
            "company_address": row["company_address"],
            "company_gstin": row["company_gstin"],
            "company_docs": row["company_docs"],
            "working_days": row["working_days"] or 26,
            "login_greeting": row["login_greeting"] or "Enterprise multi-tenant customer relationship hub",
            "shift_start": row["shift_start"] or "09:00 AM",
            "shift_end": row["shift_end"] or "06:00 PM",
            "company_pan": row["company_pan"],
            "break_duration": row["break_duration"] if row["break_duration"] is not None else 60,
            "break_start": row["break_start"] or "01:00 PM",
            "break_end": row["break_end"] or "02:00 PM",
            "saturdays_off": row["saturdays_off"] if row["saturdays_off"] is not None else "2,4"
        })

@router.put("/settings")
async def update_workspace_settings(
    payload: WorkspaceSettingsPayload,
    request: Request,
    current_user: dict = Depends(require_workspace_admin)
):
    workspace_id = current_user.get("tenant_id") or current_user.get("workspace_id")
    ip = request.client.host if request.client else None

    with get_db() as db:
        db.execute(text("""
            UPDATE workspaces 
            SET workspace_name = :company_name, business_name = :company_name, custom_domain = :custom_domain, 
                logo_url = :logo_url, brand_color = :brand_color, company_address = :company_address, 
                company_gstin = :company_gstin, company_docs = :company_docs, working_days = :working_days,
                login_greeting = :login_greeting, shift_start = :shift_start, shift_end = :shift_end, company_pan = :company_pan,
                break_duration = :break_duration, break_start = :break_start, break_end = :break_end, saturdays_off = :saturdays_off
            WHERE workspace_id = :ws_id
        """), {
            "company_name": payload.company_name,
            "custom_domain": payload.custom_domain,
            "logo_url": payload.logo_url,
            "brand_color": payload.brand_color,
            "company_address": payload.company_address,
            "company_gstin": payload.company_gstin,
            "company_docs": payload.company_docs,
            "working_days": payload.working_days,
            "login_greeting": payload.login_greeting,
            "shift_start": payload.shift_start,
            "shift_end": payload.shift_end,
            "company_pan": payload.company_pan,
            "break_duration": payload.break_duration,
            "break_start": payload.break_start,
            "break_end": payload.break_end,
            "saturdays_off": payload.saturdays_off,
            "ws_id": workspace_id
        })
        
        log_audit_event(
            db, workspace_id, current_user["id"], current_user["email"],
            "UPDATE_WORKSPACE_SETTINGS", "Updated workspace general settings and branding.", ip
        )
        db.commit()

    return success_response(message="Workspace settings updated successfully")


