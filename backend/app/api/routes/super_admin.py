"""
Super Admin Administrative Router
==================================
Endpoints reserved for Super Admins to manage workspaces/organizations,
reset workspace admin passwords, and add/remove modular features.
"""

import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Body, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import text

from backend.app.core.database import get_db
from backend.app.core.security import hash_password, create_access_token
from backend.app.api.dependencies.auth import get_current_user
from backend.app.utils.exceptions import ForbiddenException

router = APIRouter()


# ── Dependency to Enforce Super Admin Role ──────────────────────────
def require_super_admin(current_user: dict = Depends(get_current_user)) -> dict:
    role_name = current_user.get("role_name", "")
    role_id = current_user.get("role", "")
    if role_name != "Super Admin" and not str(role_id).startswith("role_super_admin_"):
        raise ForbiddenException(
            message="Access denied. Super Admin privileges required."
        )
    return current_user


# ── Plan Configuration & Limits ─────────────────────────────────────
PLAN_LIMITS = {
    "starter": {
        "max_users": 5,
        "max_contacts": 1000,
        "max_leads": 1000,
        "max_branches": 1,
        "max_pipelines": 2,
        "max_projects": 3,
        "max_automations": 2,
        "max_campaigns": 2,
        "api_access": 0,
        "white_label": 0,
        "custom_domain": 0,
        "modules": ["crm", "sales"]
    },
    "growth": {
        "max_users": 20,
        "max_contacts": 5000,
        "max_leads": 5000,
        "max_branches": 3,
        "max_pipelines": 5,
        "max_projects": 10,
        "max_automations": 5,
        "max_campaigns": 5,
        "api_access": 1,
        "white_label": 0,
        "custom_domain": 0,
        "modules": ["crm", "sales", "whatsapp", "marketing", "projects"]
    },
    "professional": {
        "max_users": 100,
        "max_contacts": 20000,
        "max_leads": 20000,
        "max_branches": 10,
        "max_pipelines": 15,
        "max_projects": 50,
        "max_automations": 20,
        "max_campaigns": 15,
        "api_access": 1,
        "white_label": 1,
        "custom_domain": 1,
        "modules": ["crm", "sales", "whatsapp", "marketing", "projects", "finance", "hrms", "support"]
    },
    "enterprise": {
        "max_users": 999999,
        "max_contacts": 999999,
        "max_leads": 999999,
        "max_branches": 999,
        "max_pipelines": 999,
        "max_projects": 999,
        "max_automations": 999,
        "max_campaigns": 999,
        "api_access": 1,
        "white_label": 1,
        "custom_domain": 1,
        "modules": ["crm", "sales", "whatsapp", "marketing", "projects", "finance", "hrms", "support", "ecommerce", "inventory", "reports", "ai_assistant"]
    }
}


# ── Schemas ─────────────────────────────────────────────────────────
class OrganizationCreate(BaseModel):
    workspace_id: str = Field(..., description="Unique slug ID (e.g. 'company_a')", min_length=3, max_length=36)
    workspace_name: str = Field(..., description="Display Name", min_length=2, max_length=255)
    business_name: Optional[str] = None
    admin_name: str = Field(..., description="Administrator's Full Name", min_length=2, max_length=255)
    admin_email: EmailStr
    admin_password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)
    mobile_number: Optional[str] = None
    company_name: Optional[str] = None
    industry: Optional[str] = None
    country: Optional[str] = "India"
    state: Optional[str] = None
    city: Optional[str] = None
    currency: Optional[str] = "INR"
    timezone: Optional[str] = "Asia/Kolkata"
    plan_id: str = "professional"
    trial_days: int = 14
    status: str = "active"

class OrganizationUpdate(BaseModel):
    workspace_name: Optional[str] = None
    business_name: Optional[str] = None
    plan_id: Optional[str] = None
    plan_status: Optional[str] = None
    max_users: Optional[int] = None
    max_contacts: Optional[int] = None
    max_storage_gb: Optional[int] = None
    custom_domain: Optional[str] = None
    brand_color: Optional[str] = None
    logo_url: Optional[str] = None
    branding_enabled: Optional[bool] = None
    mobile_branding_enabled: Optional[bool] = None

class PasswordUpdate(BaseModel):
    password: str = Field(..., min_length=6)

class FeatureToggle(BaseModel):
    module: str
    enabled: bool

class FeatureBulkToggle(BaseModel):
    modules: List[str]


# ── Seeding Roles Blueprint ─────────────────────────────────────────
ROLES_BLUEPRINT = [
    {
        "role_suffix": "admin_001",
        "name": "Organization Admin",
        "description": "Full Access Within Organization",
        "permissions": [
            {"module": "dashboard", "view": 1, "create": 1, "edit": 1, "delete": 1, "scope": "all"},
            {"module": "crm", "view": 1, "create": 1, "edit": 1, "delete": 1, "scope": "all"},
            {"module": "sales", "view": 1, "create": 1, "edit": 1, "delete": 1, "scope": "all"},
            {"module": "whatsapp", "view": 1, "create": 1, "edit": 1, "delete": 1, "scope": "all"},
            {"module": "marketing", "view": 1, "create": 1, "edit": 1, "delete": 1, "scope": "all"},
            {"module": "automation", "view": 1, "create": 1, "edit": 1, "delete": 1, "scope": "all"},
            {"module": "finance", "view": 1, "create": 1, "edit": 1, "delete": 1, "scope": "all"},
            {"module": "hrms", "view": 1, "create": 1, "edit": 1, "delete": 1, "scope": "all"},
            {"module": "support", "view": 1, "create": 1, "edit": 1, "delete": 1, "scope": "all"},
            {"module": "projects", "view": 1, "create": 1, "edit": 1, "delete": 1, "scope": "all"},
            {"module": "ecommerce", "view": 1, "create": 1, "edit": 1, "delete": 1, "scope": "all"},
            {"module": "inventory", "view": 1, "create": 1, "edit": 1, "delete": 1, "scope": "all"},
            {"module": "reports", "view": 1, "create": 1, "edit": 1, "delete": 1, "scope": "all"},
            {"module": "settings", "view": 1, "create": 1, "edit": 1, "delete": 1, "scope": "all"},
            {"module": "users", "view": 1, "create": 1, "edit": 1, "delete": 1, "scope": "all"},
            {"module": "audit_logs", "view": 1, "create": 1, "edit": 1, "delete": 1, "scope": "all"},
        ]
    }
]


# ── Audit Log Utility ────────────────────────────────────────────────
def log_saas_event(db, workspace_id: Optional[str], user_id: str, user_email: str, action: str, details: str, request: Request):
    ip_addr = request.client.host if request.client else "127.0.0.1"
    log_id = str(uuid.uuid4())
    sql = text("""
        INSERT INTO saas_audit_logs (log_id, workspace_id, user_id, user_email, action, details, ip_address)
        VALUES (:log_id, :ws_id, :u_id, :email, :action, :details, :ip)
    """)
    db.execute(sql, {
        "log_id": log_id,
        "ws_id": workspace_id,
        "u_id": user_id,
        "email": user_email,
        "action": action,
        "details": details,
        "ip": ip_addr
    })


# ── API Endpoints ───────────────────────────────────────────────────

@router.get("/dashboard-kpis", dependencies=[Depends(require_super_admin)])
def get_dashboard_kpis():
    """Retrieve SaaS KPI metrics for the Super Admin dashboard."""
    with get_db() as db:
        # Fetch stats
        total_orgs = db.execute(text("SELECT COUNT(*) FROM workspaces WHERE deleted_at IS NULL")).scalar() or 0
        active_orgs = db.execute(text("SELECT COUNT(*) FROM workspaces WHERE plan_status = 'active' AND deleted_at IS NULL")).scalar() or 0
        trial_orgs = db.execute(text("SELECT COUNT(*) FROM workspaces WHERE plan_status = 'trial' AND deleted_at IS NULL")).scalar() or 0
        suspended_orgs = db.execute(text("SELECT COUNT(*) FROM workspaces WHERE plan_status = 'suspended' AND deleted_at IS NULL")).scalar() or 0
        total_users = db.execute(text("SELECT COUNT(*) FROM users WHERE deleted_at IS NULL")).scalar() or 0

        # Calculate mock/aggregated revenue
        # Starter = $29, Growth = $99, Professional = $249, Enterprise = $999
        starter_cnt = db.execute(text("SELECT COUNT(*) FROM workspaces WHERE plan_id = 'starter' AND plan_status = 'active' AND deleted_at IS NULL")).scalar() or 0
        growth_cnt = db.execute(text("SELECT COUNT(*) FROM workspaces WHERE plan_id = 'growth' AND plan_status = 'active' AND deleted_at IS NULL")).scalar() or 0
        prof_cnt = db.execute(text("SELECT COUNT(*) FROM workspaces WHERE plan_id = 'professional' AND plan_status = 'active' AND deleted_at IS NULL")).scalar() or 0
        ent_cnt = db.execute(text("SELECT COUNT(*) FROM workspaces WHERE plan_id = 'enterprise' AND plan_status = 'active' AND deleted_at IS NULL")).scalar() or 0

        monthly_revenue = (starter_cnt * 29) + (growth_cnt * 99) + (prof_cnt * 249) + (ent_cnt * 999)
        total_revenue = monthly_revenue * 12 # Mocked cumulative

        return {
            "success": True,
            "data": {
                "totalOrganizations": total_orgs,
                "activeOrganizations": active_orgs,
                "trialOrganizations": trial_orgs,
                "suspendedOrganizations": suspended_orgs,
                "totalUsers": total_users,
                "monthlyRevenue": monthly_revenue,
                "totalRevenue": total_revenue,
                "activeSubscriptions": active_orgs,
                "expiringSubscriptions": trial_orgs,
                "featureUsage": {"CRM": 84, "WhatsApp": 62, "Projects": 48, "HRMS": 36},
                "apiUsage": 1420
            }
        }


@router.get("/audit-logs", dependencies=[Depends(require_super_admin)])
def list_saas_audit_logs():
    """Retrieve all system-wide SaaS administrative audit logs."""
    with get_db() as db:
        sql = text("SELECT * FROM saas_audit_logs ORDER BY created_at DESC LIMIT 100")
        rows = db.execute(sql).mappings().all()
        return {"success": True, "data": [dict(r) for r in rows]}


@router.get("/organizations", dependencies=[Depends(require_super_admin)])
def list_organizations():
    """List all workspaces in the database with their enabled modules status."""
    with get_db() as db:
        # Get workspaces
        sql = text("SELECT * FROM workspaces WHERE deleted_at IS NULL")
        rows = db.execute(sql).mappings().all()

        # Get modules for each workspace
        modules_sql = text("SELECT workspace_id, module, is_enabled FROM workspace_modules")
        modules_rows = db.execute(modules_sql).mappings().all()

        # Group modules by workspace_id
        ws_modules = {}
        for mr in modules_rows:
            ws_id = mr["workspace_id"]
            if ws_id not in ws_modules:
                ws_modules[ws_id] = {}
            ws_modules[ws_id][mr["module"]] = bool(mr["is_enabled"])

        data = []
        for r in rows:
            ws_dict = dict(r)
            ws_dict["modules"] = ws_modules.get(ws_dict["workspace_id"], {})
            data.append(ws_dict)

        return {"success": True, "data": data}


@router.get("/organizations/{workspace_id}", dependencies=[Depends(require_super_admin)])
def get_organization(workspace_id: str):
    """Retrieve detailed settings and admin of a workspace."""
    with get_db() as db:
        # Get workspace
        ws_sql = text("SELECT * FROM workspaces WHERE workspace_id = :ws_id AND deleted_at IS NULL")
        ws = db.execute(ws_sql, {"ws_id": workspace_id}).mappings().first()
        if not ws:
            raise HTTPException(status_code=404, detail="Organization not found")
        
        # Get admin user details
        admin_role_id = f"role_admin_001_{workspace_id}"
        user_sql = text("SELECT user_id, email, full_name, status, phone FROM users WHERE role_id = :role_id AND workspace_id = :ws_id LIMIT 1")
        user = db.execute(user_sql, {"role_id": admin_role_id, "ws_id": workspace_id}).mappings().first()
        
        # Get active modules/features
        features_sql = text("""
            SELECT DISTINCT module FROM role_permissions rp
            JOIN roles r ON rp.role_id = r.role_id
            WHERE r.workspace_id = :ws_id AND rp.can_view = 1
        """)
        features = [r[0] for r in db.execute(features_sql, {"ws_id": workspace_id}).fetchall()]

        return {
            "success": True,
            "data": {
                "organization": dict(ws),
                "admin": dict(user) if user else None,
                "enabled_features": features
            }
        }


@router.post("/organizations", dependencies=[Depends(require_super_admin)])
def create_organization(
    request: Request,
    data: OrganizationCreate,
    current_user: dict = Depends(require_super_admin)
):
    """Create a new workspace/tenant, seed its default roles/permissions, and create its Admin user."""
    if data.admin_password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    with get_db() as db:
        # Check if workspace already exists
        exist_ws = db.execute(
            text("SELECT workspace_id FROM workspaces WHERE workspace_id = :ws_id"), 
            {"ws_id": data.workspace_id}
        ).scalar()
        if exist_ws:
            raise HTTPException(status_code=400, detail="Organization Code (workspace_id) already exists")

        # Check if user already exists
        exist_user = db.execute(
            text("SELECT email FROM users WHERE email = :email"),
            {"email": str(data.admin_email)}
        ).scalar()
        if exist_user:
            raise HTTPException(status_code=400, detail="Admin email is already registered")

        # Resolve Plan details
        plan_details = PLAN_LIMITS.get(data.plan_id.lower(), PLAN_LIMITS["professional"])

        # Start a transaction block
        try:
            # 1. Insert Workspace
            ws_sql = text("""
                INSERT INTO workspaces (
                    workspace_id, workspace_name, business_name, plan_id, plan_status, 
                    max_users, max_contacts, max_storage_gb, country, state, city, currency, 
                    timezone, trial_days, max_branches, max_leads, max_pipelines, max_projects, 
                    max_automations, max_campaigns, is_locked
                ) VALUES (
                    :ws_id, :ws_name, :biz_name, :plan_id, :status, 
                    :max_users, :max_contacts, 10, :country, :state, :city, :currency, 
                    :timezone, :trial_days, :max_branches, :max_leads, :max_pipelines, :max_projects, 
                    :max_automations, :max_campaigns, 0
                )
            """)
            db.execute(ws_sql, {
                "ws_id": data.workspace_id,
                "ws_name": data.workspace_name,
                "biz_name": data.business_name or data.company_name,
                "plan_id": data.plan_id,
                "status": data.status,
                "max_users": plan_details["max_users"],
                "max_contacts": plan_details["max_contacts"],
                "country": data.country,
                "state": data.state,
                "city": data.city,
                "currency": data.currency,
                "timezone": data.timezone,
                "trial_days": data.trial_days,
                "max_branches": plan_details["max_branches"],
                "max_leads": plan_details["max_leads"],
                "max_pipelines": plan_details["max_pipelines"],
                "max_projects": plan_details["max_projects"],
                "max_automations": plan_details["max_automations"],
                "max_campaigns": plan_details["max_campaigns"]
            })

            # 2. Seed default roles and permissions based on plan allowed modules
            allowed_modules = plan_details["modules"]
            for r_info in ROLES_BLUEPRINT:
                role_id = f"role_{r_info['role_suffix']}_{data.workspace_id}"
                db.execute(text("""
                    INSERT INTO roles (role_id, workspace_id, role_name, description, is_custom)
                    VALUES (:role_id, :ws_id, :name, :desc, 0)
                """), {
                    "role_id": role_id,
                    "ws_id": data.workspace_id,
                    "name": r_info["name"],
                    "desc": r_info["description"]
                })

                for p in r_info["permissions"]:
                    # Check if module is allowed in this plan
                    is_enabled = 1 if p["module"] in allowed_modules else 0
                    rp_id = str(uuid.uuid4())
                    db.execute(text("""
                        INSERT INTO role_permissions (
                            id, role_id, module, can_view, can_create, can_edit, can_delete,
                            can_export, can_import, can_approve, can_assign, can_archive, record_scope
                        ) VALUES (
                            :id, :role_id, :module, :v, :c, :e, :d, :v, :v, :v, :v, :v, :scope
                        )
                    """), {
                        "id": rp_id,
                        "role_id": role_id,
                        "module": p["module"],
                        "v": is_enabled if p["view"] else 0,
                        "c": is_enabled if p["create"] else 0,
                        "e": is_enabled if p["edit"] else 0,
                        "d": is_enabled if p["delete"] else 0,
                        "scope": p["scope"]
                    })

            # 3. Create Default Department
            dept_id = f"dept_gen_{data.workspace_id}"
            db.execute(text("""
                INSERT INTO departments (department_id, workspace_id, name, description)
                VALUES (:dept_id, :ws_id, 'General', 'Default Seeded Department')
            """), {"dept_id": dept_id, "ws_id": data.workspace_id})

            # 4. Create Default Branch
            branch_id = f"branch_hq_{data.workspace_id}"
            db.execute(text("""
                INSERT INTO branches (branch_id, workspace_id, name, code, city, state, country)
                VALUES (:branch_id, :ws_id, 'Headquarters', 'HQ', :city, :state, :country)
            """), {
                "branch_id": branch_id,
                "ws_id": data.workspace_id,
                "city": data.city,
                "state": data.state,
                "country": data.country
            })

            # 5. Create Admin user
            pwd_hash = hash_password(data.admin_password)
            user_id = f"usr_admin_{uuid.uuid4().hex[:8]}"
            admin_role_id = f"role_admin_001_{data.workspace_id}"
            
            user_sql = text("""
                INSERT INTO users (user_id, workspace_id, role_id, full_name, email, phone, password_hash, status)
                VALUES (:user_id, :ws_id, :role_id, :name, :email, :phone, :pwd_hash, 'active')
            """)
            db.execute(user_sql, {
                "user_id": user_id,
                "ws_id": data.workspace_id,
                "role_id": admin_role_id,
                "name": data.admin_name,
                "email": str(data.admin_email),
                "phone": data.mobile_number,
                "pwd_hash": pwd_hash
            })

            log_saas_event(
                db, 
                data.workspace_id, 
                current_user.get("id", "system"), 
                current_user.get("email", "admin@super.ai"), 
                "Organization Created", 
                f"Created organization '{data.workspace_name}' on plan '{data.plan_id}'", 
                request
            )

            db.commit()
            return {"success": True, "message": "Organization created successfully", "workspace_id": data.workspace_id}

        except Exception as err:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Database execution failed: {err}")


@router.put("/organizations/{workspace_id}", dependencies=[Depends(require_super_admin)])
def update_organization(
    workspace_id: str, 
    data: OrganizationUpdate,
    request: Request,
    current_user: dict = Depends(require_super_admin)
):
    """Update organization settings, plans, or capacity limits."""
    with get_db() as db:
        ws_sql = text("SELECT workspace_id, workspace_name FROM workspaces WHERE workspace_id = :ws_id AND deleted_at IS NULL")
        ws = db.execute(ws_sql, {"ws_id": workspace_id}).mappings().first()
        if not ws:
            raise HTTPException(status_code=404, detail="Organization not found")

        update_fields = []
        params = {"ws_id": workspace_id}

        for k, v in data.dict(exclude_unset=True).items():
            # If plan changes, update limits automatically
            if k == "plan_id" and v:
                plan_details = PLAN_LIMITS.get(v.lower())
                if plan_details:
                    update_fields.extend([
                        "max_users = :max_users",
                        "max_contacts = :max_contacts",
                        "max_branches = :max_branches",
                        "max_leads = :max_leads",
                        "max_pipelines = :max_pipelines",
                        "max_projects = :max_projects",
                        "max_automations = :max_automations",
                        "max_campaigns = :max_campaigns"
                    ])
                    params.update({
                        "max_users": plan_details["max_users"],
                        "max_contacts": plan_details["max_contacts"],
                        "max_branches": plan_details["max_branches"],
                        "max_leads": plan_details["max_leads"],
                        "max_pipelines": plan_details["max_pipelines"],
                        "max_projects": plan_details["max_projects"],
                        "max_automations": plan_details["max_automations"],
                        "max_campaigns": plan_details["max_campaigns"]
                    })
            
            update_fields.append(f"{k} = :{k}")
            params[k] = v

        if not update_fields:
            return {"success": True, "message": "No fields to update"}

        try:
            sql = text(f"UPDATE workspaces SET {', '.join(update_fields)} WHERE workspace_id = :ws_id")
            db.execute(sql, params)
            
            log_saas_event(
                db, 
                workspace_id, 
                current_user.get("id", "system"), 
                current_user.get("email", "admin@super.ai"), 
                "Organization Updated", 
                f"Updated parameters for workspace '{ws['workspace_name']}'", 
                request
            )
            
            db.commit()
            return {"success": True, "message": "Organization settings updated successfully"}
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))


@router.delete("/organizations/{workspace_id}", dependencies=[Depends(require_super_admin)])
def delete_organization(
    workspace_id: str,
    request: Request,
    current_user: dict = Depends(require_super_admin)
):
    """Soft delete an organization."""
    with get_db() as db:
        ws_sql = text("SELECT workspace_id, workspace_name FROM workspaces WHERE workspace_id = :ws_id AND deleted_at IS NULL")
        ws = db.execute(ws_sql, {"ws_id": workspace_id}).mappings().first()
        if not ws:
            raise HTTPException(status_code=404, detail="Organization not found")

        try:
            db.execute(text("UPDATE workspaces SET deleted_at = CURRENT_TIMESTAMP WHERE workspace_id = :ws_id"), {"ws_id": workspace_id})
            
            log_saas_event(
                db, 
                workspace_id, 
                current_user.get("id", "system"), 
                current_user.get("email", "admin@super.ai"), 
                "Organization Deleted", 
                f"Soft deleted organization '{ws['workspace_name']}'", 
                request
            )
            
            db.commit()
            return {"success": True, "message": "Organization soft deleted successfully"}
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))


@router.put("/organizations/{workspace_id}/status", dependencies=[Depends(require_super_admin)])
def toggle_organization_status(
    workspace_id: str,
    request: Request,
    status: str = Body(..., embed=True),
    current_user: dict = Depends(require_super_admin)
):
    """Allows Super Admin to directly suspend or activate a workspace."""
    with get_db() as db:
        ws_sql = text("SELECT workspace_id, workspace_name FROM workspaces WHERE workspace_id = :ws_id AND deleted_at IS NULL")
        ws = db.execute(ws_sql, {"ws_id": workspace_id}).mappings().first()
        if not ws:
            raise HTTPException(status_code=404, detail="Organization not found")

        # Update lock and status
        is_lock = 1 if status.lower() == "lock" else 0
        db_status = "suspended" if status.lower() in ("suspended", "lock") else status.lower()
        
        try:
            db.execute(text("""
                UPDATE workspaces 
                SET plan_status = :status, is_locked = :lock 
                WHERE workspace_id = :ws_id
            """), {"status": db_status, "lock": is_lock, "ws_id": workspace_id})

            log_saas_event(
                db, 
                workspace_id, 
                current_user.get("id", "system"), 
                current_user.get("email", "admin@super.ai"), 
                "Status Changed", 
                f"Updated organization '{ws['workspace_name']}' status to '{status}'", 
                request
            )
            db.commit()
            return {"success": True, "message": f"Organization status updated to '{status}'"}
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))


@router.post("/organizations/{workspace_id}/impersonate", dependencies=[Depends(require_super_admin)])
def impersonate_organization(workspace_id: str):
    """Generate an impersonation token to log in as the workspace admin."""
    with get_db() as db:
        admin_role_id = f"role_admin_001_{workspace_id}"
        admin_sql = text("SELECT * FROM users WHERE role_id = :role_id AND workspace_id = :ws_id LIMIT 1")
        admin = db.execute(admin_sql, {"role_id": admin_role_id, "ws_id": workspace_id}).mappings().first()
        if not admin:
            raise HTTPException(status_code=404, detail="Workspace admin user not found")

        token_payload = {
            "sub": admin["user_id"],
            "email": admin["email"],
            "role": admin["role_id"],
            "tenant_id": workspace_id
        }
        token = create_access_token(token_payload)
        return {
            "success": True,
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": admin["user_id"],
                "email": admin["email"],
                "full_name": admin["full_name"],
                "role": "admin"
            }
        }


@router.put("/organizations/{workspace_id}/password", dependencies=[Depends(require_super_admin)])
def reset_organization_admin_password(
    workspace_id: str, 
    data: PasswordUpdate,
    request: Request,
    current_user: dict = Depends(require_super_admin)
):
    """Allows Super Admin to directly update the password of a workspace's admin user."""
    with get_db() as db:
        # Find the Admin user of this workspace
        admin_role_id = f"role_admin_001_{workspace_id}"
        admin_sql = text("SELECT user_id, email FROM users WHERE role_id = :role_id AND workspace_id = :ws_id LIMIT 1")
        admin = db.execute(admin_sql, {"role_id": admin_role_id, "ws_id": workspace_id}).mappings().first()
        
        if not admin:
            raise HTTPException(status_code=404, detail="Workspace admin user not found")

        pwd_hash = hash_password(data.password)
        try:
            update_sql = text("UPDATE users SET password_hash = :pwd_hash WHERE user_id = :u_id")
            db.execute(update_sql, {"pwd_hash": pwd_hash, "u_id": admin["user_id"]})
            
            log_saas_event(
                db, 
                workspace_id, 
                current_user.get("id", "system"), 
                current_user.get("email", "admin@super.ai"), 
                "Password Reset", 
                f"Direct admin password reset for user '{admin['email']}'", 
                request
            )
            
            db.commit()
            return {"success": True, "message": "Admin password updated successfully"}
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))


@router.put("/users/{user_id}/status", dependencies=[Depends(require_super_admin)])
def toggle_user_account_lock(
    user_id: str,
    request: Request,
    status: str = Body(..., embed=True),
    current_user: dict = Depends(require_super_admin)
):
    """Lock or unlock a user account."""
    with get_db() as db:
        user_sql = text("SELECT user_id, email, workspace_id FROM users WHERE user_id = :u_id AND deleted_at IS NULL")
        user = db.execute(user_sql, {"u_id": user_id}).mappings().first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        is_locked = 1 if status.lower() == "lock" else 0
        db_status = "inactive" if is_locked else "active"

        try:
            db.execute(text("""
                UPDATE users 
                SET is_locked = :lock, status = :status 
                WHERE user_id = :u_id
            """), {"lock": is_locked, "status": db_status, "u_id": user_id})

            log_saas_event(
                db, 
                user["workspace_id"], 
                current_user.get("id", "system"), 
                current_user.get("email", "admin@super.ai"), 
                "User Account Modified", 
                f"Updated lock/status of user '{user['email']}' to locked={is_locked}", 
                request
            )
            db.commit()
            return {"success": True, "message": f"User status set to locked={is_locked}"}
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))


@router.put("/users/{user_id}/2fa", dependencies=[Depends(require_super_admin)])
def toggle_user_2fa(
    user_id: str,
    request: Request,
    enabled: bool = Body(..., embed=True),
    current_user: dict = Depends(require_super_admin)
):
    """Toggle 2FA for a user account."""
    with get_db() as db:
        user_sql = text("SELECT user_id, email, workspace_id FROM users WHERE user_id = :u_id AND deleted_at IS NULL")
        user = db.execute(user_sql, {"u_id": user_id}).mappings().first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        val = 1 if enabled else 0
        try:
            db.execute(text("UPDATE users SET two_factor_enabled = :val WHERE user_id = :u_id"), {"val": val, "u_id": user_id})
            
            log_saas_event(
                db, 
                user["workspace_id"], 
                current_user.get("id", "system"), 
                current_user.get("email", "admin@super.ai"), 
                "User 2FA Modified", 
                f"Set 2FA status of user '{user['email']}' to enabled={enabled}", 
                request
            )
            db.commit()
            return {"success": True, "message": f"User 2FA state updated to {enabled}"}
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))


@router.put("/organizations/{workspace_id}/features", dependencies=[Depends(require_super_admin)])
def toggle_organization_features(
    workspace_id: str, 
    feature: FeatureToggle,
    request: Request,
    current_user: dict = Depends(require_super_admin)
):
    """Add or remove specific features/modules for the workspace by enabling/disabling permissions."""
    with get_db() as db:
        # Get all roles of this workspace
        roles_sql = text("SELECT role_id FROM roles WHERE workspace_id = :ws_id")
        roles = [r[0] for r in db.execute(roles_sql, {"ws_id": workspace_id}).fetchall()]

        if not roles:
            raise HTTPException(status_code=404, detail="No roles found for this organization")

        try:
            val = 1 if feature.enabled else 0
            for r_id in roles:
                check_sql = text("SELECT id FROM role_permissions WHERE role_id = :role_id AND module = :module")
                rp_id = db.execute(check_sql, {"role_id": r_id, "module": feature.module}).scalar()
                
                if rp_id:
                    update_sql = text("""
                        UPDATE role_permissions 
                        SET can_view = :val, can_create = :val, can_edit = :val, can_delete = :val 
                        WHERE id = :id
                    """)
                    db.execute(update_sql, {"val": val, "id": rp_id})
                else:
                    new_rp_id = str(uuid.uuid4())
                    insert_sql = text("""
                        INSERT INTO role_permissions (id, role_id, module, can_view, can_create, can_edit, can_delete, record_scope)
                        VALUES (:id, :role_id, :module, :val, :val, :val, :val, 'all')
                    """)
                    db.execute(insert_sql, {"id": new_rp_id, "role_id": r_id, "module": feature.module, "val": val})

            log_saas_event(
                db, 
                workspace_id, 
                current_user.get("id", "system"), 
                current_user.get("email", "admin@super.ai"), 
                "Feature Modified", 
                f"Set feature '{feature.module}' enabled={feature.enabled} for organization", 
                request
            )

            db.commit()
            action_str = "enabled" if feature.enabled else "disabled"
            return {"success": True, "message": f"Feature '{feature.module}' successfully {action_str} for organization"}
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))


# ── Transfer Ownership ──────────────────────────────────────────────
class OwnershipTransfer(BaseModel):
    new_admin_email: EmailStr
    new_admin_name: str = Field(..., min_length=2, max_length=255)


@router.put("/organizations/{workspace_id}/transfer-ownership", dependencies=[Depends(require_super_admin)])
def transfer_ownership(
    workspace_id: str,
    data: OwnershipTransfer,
    request: Request,
    current_user: dict = Depends(require_super_admin)
):
    """Transfer workspace admin ownership to a new user."""
    with get_db() as db:
        ws = db.execute(
            text("SELECT workspace_id, workspace_name FROM workspaces WHERE workspace_id = :ws_id AND deleted_at IS NULL"),
            {"ws_id": workspace_id}
        ).mappings().first()
        if not ws:
            raise HTTPException(status_code=404, detail="Organization not found")

        admin_role_id = f"role_admin_001_{workspace_id}"

        # Find the current admin
        old_admin = db.execute(
            text("SELECT user_id, email FROM users WHERE role_id = :role_id AND workspace_id = :ws_id LIMIT 1"),
            {"role_id": admin_role_id, "ws_id": workspace_id}
        ).mappings().first()

        try:
            # Check if new email already exists
            existing = db.execute(
                text("SELECT user_id FROM users WHERE email = :email"),
                {"email": str(data.new_admin_email)}
            ).scalar()

            if existing:
                # If user exists, just reassign their role to admin
                db.execute(text("UPDATE users SET role_id = :role_id WHERE user_id = :uid"), {
                    "role_id": admin_role_id, "uid": existing
                })
            else:
                # Create new admin user with a default password
                from backend.app.core.security import hash_password as hp
                new_uid = f"usr_admin_{uuid.uuid4().hex[:8]}"
                pwd_hash = hp("Admin@123")  # Default, they should reset
                db.execute(text("""
                    INSERT INTO users (user_id, workspace_id, role_id, full_name, email, password_hash, status)
                    VALUES (:uid, :ws_id, :role_id, :name, :email, :pwd, 'active')
                """), {
                    "uid": new_uid, "ws_id": workspace_id, "role_id": admin_role_id,
                    "name": data.new_admin_name, "email": str(data.new_admin_email), "pwd": pwd_hash
                })

            # Demote old admin to Sales Manager if they exist
            if old_admin and old_admin["email"] != str(data.new_admin_email):
                mgr_role_id = f"role_mgr_001_{workspace_id}"
                db.execute(text("UPDATE users SET role_id = :role_id WHERE user_id = :uid"), {
                    "role_id": mgr_role_id, "uid": old_admin["user_id"]
                })

            old_email = old_admin["email"] if old_admin else "N/A"
            log_saas_event(
                db, workspace_id,
                current_user.get("id", "system"), current_user.get("email", "admin@super.ai"),
                "Ownership Transferred",
                f"Transferred ownership of '{ws['workspace_name']}' from '{old_email}' to '{data.new_admin_email}'",
                request
            )
            db.commit()
            return {"success": True, "message": f"Ownership transferred to {data.new_admin_email}"}
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))


# ── Extend Trial ────────────────────────────────────────────────────
class TrialExtension(BaseModel):
    extra_days: int = Field(..., ge=1, le=365)


@router.put("/organizations/{workspace_id}/extend-trial", dependencies=[Depends(require_super_admin)])
def extend_trial(
    workspace_id: str,
    data: TrialExtension,
    request: Request,
    current_user: dict = Depends(require_super_admin)
):
    """Extend the trial period for a workspace."""
    with get_db() as db:
        ws = db.execute(
            text("SELECT workspace_id, workspace_name, trial_days, plan_status FROM workspaces WHERE workspace_id = :ws_id AND deleted_at IS NULL"),
            {"ws_id": workspace_id}
        ).mappings().first()
        if not ws:
            raise HTTPException(status_code=404, detail="Organization not found")

        new_trial_days = (ws["trial_days"] or 0) + data.extra_days
        new_status = "trial" if ws["plan_status"] in ("expired", "suspended") else ws["plan_status"]

        try:
            db.execute(text("""
                UPDATE workspaces 
                SET trial_days = :days, plan_status = :status,
                    trial_ends_at = DATE_ADD(COALESCE(trial_ends_at, CURRENT_TIMESTAMP), INTERVAL :extra DAY)
                WHERE workspace_id = :ws_id
            """), {"days": new_trial_days, "status": new_status, "extra": data.extra_days, "ws_id": workspace_id})

            log_saas_event(
                db, workspace_id,
                current_user.get("id", "system"), current_user.get("email", "admin@super.ai"),
                "Trial Extended",
                f"Extended trial by {data.extra_days} days for '{ws['workspace_name']}' (total: {new_trial_days} days)",
                request
            )
            db.commit()
            return {"success": True, "message": f"Trial extended by {data.extra_days} days (total: {new_trial_days})"}
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))


# ── Organization Usage ──────────────────────────────────────────────
@router.get("/organizations/{workspace_id}/usage", dependencies=[Depends(require_super_admin)])
def get_organization_usage(workspace_id: str):
    """Get per-org usage statistics — current vs max limits."""
    with get_db() as db:
        ws = db.execute(
            text("SELECT * FROM workspaces WHERE workspace_id = :ws_id AND deleted_at IS NULL"),
            {"ws_id": workspace_id}
        ).mappings().first()
        if not ws:
            raise HTTPException(status_code=404, detail="Organization not found")

        user_count = db.execute(text("SELECT COUNT(*) FROM users WHERE workspace_id = :ws_id AND deleted_at IS NULL"), {"ws_id": workspace_id}).scalar() or 0
        lead_count = db.execute(text("SELECT COUNT(*) FROM leads WHERE workspace_id = :ws_id AND deleted_at IS NULL"), {"ws_id": workspace_id}).scalar() or 0
        contact_count = db.execute(text("SELECT COUNT(*) FROM contacts WHERE workspace_id = :ws_id"), {"ws_id": workspace_id}).scalar() or 0
        client_count = db.execute(text("SELECT COUNT(*) FROM clients WHERE workspace_id = :ws_id"), {"ws_id": workspace_id}).scalar() or 0

        # Safely try project count
        try:
            project_count = db.execute(text("SELECT COUNT(*) FROM projects WHERE workspace_id = :ws_id"), {"ws_id": workspace_id}).scalar() or 0
        except Exception:
            project_count = 0

        # Get enabled modules
        features_sql = text("""
            SELECT DISTINCT module FROM role_permissions rp
            JOIN roles r ON rp.role_id = r.role_id
            WHERE r.workspace_id = :ws_id AND rp.can_view = 1
        """)
        features = [r[0] for r in db.execute(features_sql, {"ws_id": workspace_id}).fetchall()]

        return {
            "success": True,
            "data": {
                "workspace_name": ws["workspace_name"],
                "plan_id": ws["plan_id"],
                "users": {"current": user_count, "max": ws["max_users"]},
                "leads": {"current": lead_count, "max": ws.get("max_leads", 1000)},
                "contacts": {"current": contact_count, "max": ws["max_contacts"]},
                "clients": {"current": client_count, "max": 999999},
                "projects": {"current": project_count, "max": ws.get("max_projects", 10)},
                "branches": {"max": ws.get("max_branches", 1)},
                "pipelines": {"max": ws.get("max_pipelines", 5)},
                "storage_gb": {"max": ws.get("max_storage_gb", 10)},
                "enabled_features": features
            }
        }


# ── Organization Analytics ──────────────────────────────────────────
@router.get("/organizations/{workspace_id}/analytics", dependencies=[Depends(require_super_admin)])
def get_organization_analytics(workspace_id: str):
    """Get per-org analytics — user activity, module engagement, login history."""
    with get_db() as db:
        ws = db.execute(
            text("SELECT workspace_id, workspace_name FROM workspaces WHERE workspace_id = :ws_id AND deleted_at IS NULL"),
            {"ws_id": workspace_id}
        ).mappings().first()
        if not ws:
            raise HTTPException(status_code=404, detail="Organization not found")

        # Total & active users
        total_users = db.execute(text("SELECT COUNT(*) FROM users WHERE workspace_id = :ws_id AND deleted_at IS NULL"), {"ws_id": workspace_id}).scalar() or 0
        active_users = db.execute(text("SELECT COUNT(*) FROM users WHERE workspace_id = :ws_id AND status = 'active' AND deleted_at IS NULL"), {"ws_id": workspace_id}).scalar() or 0

        # Users who logged in last 30 days
        recent_logins = db.execute(text("""
            SELECT COUNT(*) FROM users 
            WHERE workspace_id = :ws_id AND last_login >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 30 DAY)
            AND deleted_at IS NULL
        """), {"ws_id": workspace_id}).scalar() or 0

        # Audit log activity last 30 days
        audit_actions = db.execute(text("""
            SELECT COUNT(*) FROM audit_logs
            WHERE workspace_id = :ws_id AND created_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 30 DAY)
        """), {"ws_id": workspace_id}).scalar() or 0

        # Module usage breakdown from audit_logs
        module_usage_raw = db.execute(text("""
            SELECT module, COUNT(*) as cnt FROM audit_logs
            WHERE workspace_id = :ws_id AND module IS NOT NULL
            AND created_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 30 DAY)
            GROUP BY module ORDER BY cnt DESC LIMIT 10
        """), {"ws_id": workspace_id}).mappings().all()
        module_usage = {r["module"]: r["cnt"] for r in module_usage_raw}

        # Lead activity last 30 days
        new_leads_30d = db.execute(text("""
            SELECT COUNT(*) FROM leads
            WHERE workspace_id = :ws_id AND created_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 30 DAY)
            AND deleted_at IS NULL
        """), {"ws_id": workspace_id}).scalar() or 0

        return {
            "success": True,
            "data": {
                "workspace_name": ws["workspace_name"],
                "total_users": total_users,
                "active_users": active_users,
                "recent_logins_30d": recent_logins,
                "audit_actions_30d": audit_actions,
                "module_usage_30d": module_usage if module_usage else {"crm": 0, "sales": 0},
                "new_leads_30d": new_leads_30d
            }
        }


# ── Organization Billing ────────────────────────────────────────────
PLAN_PRICING = {
    "starter": {"monthly": 29, "annual": 290},
    "growth": {"monthly": 99, "annual": 990},
    "professional": {"monthly": 249, "annual": 2490},
    "enterprise": {"monthly": 999, "annual": 9990},
}


@router.get("/organizations/{workspace_id}/billing", dependencies=[Depends(require_super_admin)])
def get_organization_billing(workspace_id: str):
    """Get billing/subscription summary for a workspace."""
    with get_db() as db:
        ws = db.execute(
            text("SELECT * FROM workspaces WHERE workspace_id = :ws_id AND deleted_at IS NULL"),
            {"ws_id": workspace_id}
        ).mappings().first()
        if not ws:
            raise HTTPException(status_code=404, detail="Organization not found")

        plan = ws["plan_id"] or "professional"
        pricing = PLAN_PRICING.get(plan.lower(), PLAN_PRICING["professional"])

        from datetime import datetime, timedelta
        created = ws.get("created_at") or datetime.now()
        if isinstance(created, str):
            try:
                created = datetime.fromisoformat(created)
            except Exception:
                created = datetime.now()
        next_renewal = created.replace(day=1) + timedelta(days=32)
        next_renewal = next_renewal.replace(day=1)

        return {
            "success": True,
            "data": {
                "workspace_name": ws["workspace_name"],
                "plan_id": plan,
                "plan_status": ws["plan_status"],
                "billing_cycle": "monthly",
                "monthly_price": pricing["monthly"],
                "annual_price": pricing["annual"],
                "currency": ws.get("currency", "USD"),
                "max_users": ws["max_users"],
                "max_contacts": ws["max_contacts"],
                "trial_days": ws.get("trial_days", 0),
                "trial_ends_at": str(ws.get("trial_ends_at", "")) if ws.get("trial_ends_at") else None,
                "created_at": str(created),
                "next_renewal": str(next_renewal),
                "billing_email": ws.get("billing_email", "")
            }
        }


# ── Global Users List ───────────────────────────────────────────────
@router.get("/users", dependencies=[Depends(require_super_admin)])
def list_all_users():
    """List all users across all workspaces (for global user management)."""
    with get_db() as db:
        sql = text("""
            SELECT u.user_id, u.workspace_id, u.role_id, u.full_name, u.email, u.phone,
                   u.status, u.is_locked, u.two_factor_enabled, u.last_login, u.created_at,
                   w.workspace_name, r.role_name
            FROM users u
            LEFT JOIN workspaces w ON u.workspace_id = w.workspace_id
            LEFT JOIN roles r ON u.role_id = r.role_id
            WHERE u.deleted_at IS NULL
            ORDER BY u.created_at DESC
            LIMIT 500
        """)
        rows = db.execute(sql).mappings().all()
        return {"success": True, "data": [dict(r) for r in rows]}


# ── Reset Any User's Password ───────────────────────────────────────
@router.put("/users/{user_id}/password", dependencies=[Depends(require_super_admin)])
def reset_user_password(
    user_id: str,
    data: PasswordUpdate,
    request: Request,
    current_user: dict = Depends(require_super_admin)
):
    """Reset any user's password (not just workspace admins)."""
    with get_db() as db:
        user = db.execute(
            text("SELECT user_id, email, workspace_id FROM users WHERE user_id = :uid AND deleted_at IS NULL"),
            {"uid": user_id}
        ).mappings().first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        pwd_hash = hash_password(data.password)
        try:
            db.execute(text("UPDATE users SET password_hash = :pwd WHERE user_id = :uid"), {
                "pwd": pwd_hash, "uid": user_id
            })
            log_saas_event(
                db, user["workspace_id"],
                current_user.get("id", "system"), current_user.get("email", "admin@super.ai"),
                "User Password Reset",
                f"Password reset for user '{user['email']}' by Super Admin",
                request
            )
            db.commit()
            return {"success": True, "message": f"Password reset for {user['email']}"}
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))


# ── SaaS Modules & Roles Management ─────────────────────────────────

class ModulesUpdate(BaseModel):
    modules: dict[str, bool]

@router.put("/organizations/{workspace_id}/modules", dependencies=[Depends(require_super_admin)])
def update_organization_modules(
    workspace_id: str,
    data: ModulesUpdate,
    request: Request,
    current_user: dict = Depends(require_super_admin)
):
    """Enable or disable multiple modules for the organization."""
    with get_db() as db:
        try:
            for mod, enabled in data.modules.items():
                val = 1 if enabled else 0
                exist_sql = text("SELECT 1 FROM workspace_modules WHERE workspace_id = :ws_id AND module = :module")
                exists = db.execute(exist_sql, {"ws_id": workspace_id, "module": mod}).scalar()
                if exists:
                    update_sql = text("""
                        UPDATE workspace_modules 
                        SET is_enabled = :val, updated_by = :uid 
                        WHERE workspace_id = :ws_id AND module = :module
                    """)
                    db.execute(update_sql, {"val": val, "uid": current_user.get("id"), "ws_id": workspace_id, "module": mod})
                else:
                    insert_sql = text("""
                        INSERT INTO workspace_modules (workspace_id, module, is_enabled, updated_by)
                        VALUES (:ws_id, :module, :val, :uid)
                    """)
                    db.execute(insert_sql, {"ws_id": workspace_id, "module": mod, "val": val, "uid": current_user.get("id")})

            log_saas_event(
                db, workspace_id,
                current_user.get("id", "system"), current_user.get("email", "admin@super.ai"),
                "Modules Configuration Updated",
                f"Updated modules configurations: {data.modules}",
                request
            )
            db.commit()
            return {"success": True, "message": "Workspace modules updated successfully"}
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))


@router.get("/organizations/{workspace_id}/roles-summary", dependencies=[Depends(require_super_admin)])
def get_roles_summary(workspace_id: str):
    """Return role count statistics for the organization."""
    with get_db() as db:
        sql = text("""
            SELECT wr.role_suffix, COALESCE(r.role_name, wr.role_suffix) AS role_name, 
                   COUNT(u.user_id) AS user_count, wr.is_enabled
            FROM workspace_roles wr
            LEFT JOIN roles r ON r.role_id = CONCAT('role_', wr.role_suffix, '_', wr.workspace_id)
            LEFT JOIN users u ON u.role_id = r.role_id AND u.workspace_id = wr.workspace_id AND u.deleted_at IS NULL
            WHERE wr.workspace_id = :workspace_id
            GROUP BY wr.role_suffix, r.role_name, wr.is_enabled
        """)
        rows = db.execute(sql, {"workspace_id": workspace_id}).mappings().all()
        return {"success": True, "data": [dict(r) for r in rows]}


class RoleToggle(BaseModel):
    role_suffix: str
    enabled: bool

@router.put("/organizations/{workspace_id}/roles", dependencies=[Depends(require_super_admin)])
def update_organization_roles(
    workspace_id: str,
    data: RoleToggle,
    request: Request,
    current_user: dict = Depends(require_super_admin)
):
    """Enable or disable a specific role suffix for the organization."""
    with get_db() as db:
        try:
            val = 1 if data.enabled else 0
            exist_sql = text("SELECT 1 FROM workspace_roles WHERE workspace_id = :ws_id AND role_suffix = :role_suffix")
            exists = db.execute(exist_sql, {"ws_id": workspace_id, "role_suffix": data.role_suffix}).scalar()
            if exists:
                update_sql = text("""
                    UPDATE workspace_roles 
                    SET is_enabled = :val 
                    WHERE workspace_id = :ws_id AND role_suffix = :role_suffix
                """)
                db.execute(update_sql, {"val": val, "ws_id": workspace_id, "role_suffix": data.role_suffix})
            else:
                insert_sql = text("""
                    INSERT INTO workspace_roles (workspace_id, role_suffix, is_enabled)
                    VALUES (:ws_id, :role_suffix, :val)
                """)
                db.execute(insert_sql, {"ws_id": workspace_id, "role_suffix": data.role_suffix, "val": val})

            log_saas_event(
                db, workspace_id,
                current_user.get("id", "system"), current_user.get("email", "admin@super.ai"),
                "Role Configuration Updated",
                f"Set role '{data.role_suffix}' enabled={data.enabled}",
                request
            )
            db.commit()
            return {"success": True, "message": f"Role '{data.role_suffix}' updated successfully"}
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))


# ── Rate Limiter ────────────────────────────────────────────────────
import time
from collections import defaultdict

RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = 100
request_history = defaultdict(list)

def check_rate_limit(request: Request):
    ip = request.client.host if request.client else "127.0.0.1"
    now = time.time()
    request_history[ip] = [t for t in request_history[ip] if now - t < RATE_LIMIT_WINDOW]
    if len(request_history[ip]) >= RATE_LIMIT_MAX_REQUESTS:
        raise HTTPException(status_code=429, detail="Too many requests. Rate limit exceeded.")
    request_history[ip].append(now)


# ── Granular Permissions Matrix Endpoints ────────────────────────────

FEATURES_BLUEPRINT = [
    # ── Dashboards (sidebar: Dashboards group) ──
    ("dashboard", "Main KPI", "/"),
    ("dashboard", "Sales Dashboard", "/dashboard/sales"),
    ("dashboard", "Team Dashboard", "/dashboard/team"),
    ("dashboard", "Analytics Dashboard", "/dashboard/analytics"),
    # ── CRM & Sales (sidebar: CRM & Sales group) ──
    ("crm", "Leads Management", "/crm/leads"),
    ("crm", "Contacts Directory", "/crm/contacts"),
    ("crm", "Clients List", "/crm/clients"),
    ("crm", "Pipeline Board", "/crm/pipeline"),
    # ── Omnichannel Hub (sidebar: Omnichannel Hub group) ──
    ("whatsapp", "WhatsApp Chat Inbox", "/omnichannel/whatsapp"),
    ("whatsapp", "WhatsApp Automation", "/omnichannel/whatsapp/automation"),
    ("whatsapp", "Call Dialer", "/omnichannel/calls"),
    ("whatsapp", "Email Inbox", "/omnichannel/email"),
    ("whatsapp", "SMS Inbox", "/omnichannel/sms"),
    # ── E-Commerce (sidebar: E-Commerce group) ──
    ("ecommerce", "Orders Management", "/ecommerce/orders"),
    ("ecommerce", "Customers", "/ecommerce/customers"),
    ("ecommerce", "Products List", "/ecommerce/products"),
    ("ecommerce", "Inventory Management", "/ecommerce/inventory"),
    ("ecommerce", "Abandoned Carts", "/ecommerce/abandoned"),
    # ── Marketing Suite (sidebar: Marketing Suite group) ──
    ("marketing", "Campaigns", "/marketing/campaigns"),
    ("automation", "Automations", "/marketing/automations"),
    # ── Support Center (sidebar: Support Center group) ──
    ("support", "Support Tickets", "/support/tickets"),
    # ── Finance & Billing (sidebar: Finance & Billing group) ──
    ("finance", "Billing Dashboard", "/finance/billing"),
    ("finance", "Invoices Management", "/finance/invoices"),
    ("finance", "Quotes Builder", "/finance/quotes"),
    ("finance", "Payments Tracker", "/finance/payments"),
    ("finance", "General Ledger", "/finance/ledger"),
    ("finance", "Expense Tracker", "/finance/expenses"),
    ("finance", "GST Reports", "/finance/gst"),
    # ── HRMS & Payroll (sidebar: HRMS & Payroll group) ──
    ("hrms", "HR Dashboard", "/hrms/dashboard"),
    ("hrms", "Employee Directory", "/hrms/directory"),
    ("hrms", "Attendance Tracker", "/hrms/attendance"),
    ("hrms", "Leaves Management", "/hrms/leaves"),
    ("hrms", "Payroll Processor", "/hrms/payroll"),
    # ── Projects (sidebar: Projects group) ──
    ("projects", "Project Dashboard", "/projects/dashboard"),
    ("projects", "Projects List", "/projects/all"),
    ("projects", "Pipeline Board", "/projects/pipeline"),
    ("projects", "Gantt Chart", "/projects/gantt"),
    ("projects", "Project Reports", "/projects/reports"),
    # ── Tasks & Calendar (sidebar: Tasks & Calendar group, module=projects) ──
    ("projects", "Task Board", "/tasks"),
    ("projects", "Reminders", "/tasks/reminders"),
    # ── Admin Console (sidebar: Admin Console group) ──
    ("settings", "AI Assistant Hub", "/admin/ai"),
    ("settings", "White Label Settings", "/admin/whitelabel"),
    ("settings", "Integrations Hub", "/admin/integrations"),
    ("settings", "API Management", "/admin/api"),
    ("settings", "Appearance & Theme", "/admin/appearance"),
    ("users", "User Management", "/admin/users"),
    ("users", "Roles & Permissions", "/admin/roles"),
    ("audit_logs", "Audit Logs", "/admin/audit-logs"),
    # ── Integrations (detailed integration connectors) ──
    ("integrations", "Meta Platforms", "/admin/integrations/meta_platforms"),
    ("integrations", "Shopify Store", "/admin/integrations/shopify"),
    ("integrations", "WooCommerce Store", "/admin/integrations/woocommerce"),
    ("integrations", "Amazon Seller Central", "/admin/integrations/amazon"),
    ("integrations", "Flipkart Seller Hub", "/admin/integrations/flipkart"),
    ("integrations", "Myntra Seller Hub", "/admin/integrations/myntra"),
    ("integrations", "Meesho Supplier Hub", "/admin/integrations/meesho"),
    ("integrations", "WordPress REST API", "/admin/integrations/wordpress"),
    ("integrations", "Custom Website Webhooks", "/admin/integrations/custom_website"),
    ("integrations", "TallyPrime ERP Connector", "/admin/integrations/tally"),
    ("integrations", "JustDial Lead Sync", "/admin/integrations/justdial"),
    ("integrations", "IndiaMART Lead Manager", "/admin/integrations/indiamart"),
    ("integrations", "TradeIndia Lead Connector", "/admin/integrations/tradeindia"),
    ("integrations", "Razorpay Gateway", "/admin/integrations/razorpay"),
    ("integrations", "Stripe Gateway", "/admin/integrations/stripe"),
    ("integrations", "Cashfree Gateway", "/admin/integrations/cashfree"),
    ("integrations", "PayU Payments", "/admin/integrations/payu"),
    ("integrations", "PhonePe Gateway", "/admin/integrations/phonepe"),
    ("integrations", "Twilio Voice API", "/admin/integrations/twilio"),
    ("integrations", "Exotel Softphone API", "/admin/integrations/exotel"),
    ("integrations", "Knowlarity Telephony", "/admin/integrations/knowlarity"),
    ("integrations", "MSG91 Gateway", "/admin/integrations/msg91"),
    ("integrations", "TextLocal SMS API", "/admin/integrations/textlocal"),
    ("integrations", "SMTP Server", "/admin/integrations/smtp"),
    ("integrations", "SendGrid Email API", "/admin/integrations/sendgrid"),
    ("integrations", "Brevo (Sendinblue) Email", "/admin/integrations/brevo"),
    ("integrations", "Amazon SES Email", "/admin/integrations/amazon_ses"),
]


class PermissionItem(BaseModel):
    module: str
    feature: str
    can_add: bool
    can_edit: bool
    can_delete: bool
    can_view: bool
    can_full: bool

class BulkPermissionsUpdate(BaseModel):
    permissions: List[PermissionItem]

class ModuleToggle(BaseModel):
    enabled: bool

@router.get("/organizations/{workspace_id}/permissions", dependencies=[Depends(require_super_admin), Depends(check_rate_limit)])
def get_workspace_permissions(workspace_id: str):
    """Retrieve full granular permissions matrix for a workspace."""
    with get_db() as db:
        # Seed missing blueprint items dynamically
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

        sql = text("""
            SELECT id, module, feature, link, can_add, can_edit, can_delete, can_view, can_full
            FROM workspace_permissions
            WHERE workspace_id = :ws_id
            ORDER BY module, feature
        """)
        rows = db.execute(sql, {"ws_id": workspace_id}).mappings().all()
        return {"success": True, "data": [dict(r) for r in rows]}

@router.put("/organizations/{workspace_id}/modules/{module}", dependencies=[Depends(require_super_admin), Depends(check_rate_limit)])
def toggle_workspace_module(
    workspace_id: str,
    module: str,
    data: ModuleToggle,
    request: Request,
    current_user: dict = Depends(require_super_admin)
):
    """Toggle a main module on/off. If disabled, automatically set all related permissions to false."""
    allowed_modules = [
        "dashboard", "crm", "sales", "whatsapp", "marketing", "automation",
        "finance", "hrms", "support", "projects", "reports", "settings",
        "users", "audit_logs", "integrations", "ecommerce", "inventory"
    ]
    if module not in allowed_modules:
        raise HTTPException(status_code=400, detail="Invalid module identifier")

    with get_db() as db:
        try:
            val = 1 if data.enabled else 0
            
            # 1. Update/Insert into workspace_modules
            exist_sql = text("SELECT 1 FROM workspace_modules WHERE workspace_id = :ws_id AND module = :module")
            exists = db.execute(exist_sql, {"ws_id": workspace_id, "module": module}).scalar()
            if exists:
                db.execute(text("""
                    UPDATE workspace_modules 
                    SET is_enabled = :val, updated_by = :uid 
                    WHERE workspace_id = :ws_id AND module = :module
                """), {"val": val, "uid": current_user.get("id"), "ws_id": workspace_id, "module": module})
            else:
                db.execute(text("""
                    INSERT INTO workspace_modules (workspace_id, module, is_enabled, updated_by)
                    VALUES (:ws_id, :module, :val, :uid)
                """), {"ws_id": workspace_id, "module": module, "val": val, "uid": current_user.get("id")})

            # 2. If disabled, set all granular permissions for this module to false
            if not data.enabled:
                db.execute(text("""
                    UPDATE workspace_permissions
                    SET can_add = 0, can_edit = 0, can_delete = 0, can_view = 0, can_full = 0, updated_by = :uid
                    WHERE workspace_id = :ws_id AND module = :module
                """), {"ws_id": workspace_id, "module": module, "uid": current_user.get("id")})

            log_saas_event(
                db, workspace_id,
                current_user.get("id", "system"), current_user.get("email", "admin@super.ai"),
                "Module State Toggled",
                f"Toggled module '{module}' enabled={data.enabled}",
                request
            )
            db.commit()
            return {"success": True, "message": f"Module '{module}' toggled successfully"}
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

@router.put("/organizations/{workspace_id}/permissions", dependencies=[Depends(require_super_admin), Depends(check_rate_limit)])
def bulk_update_workspace_permissions(
    workspace_id: str,
    data: BulkPermissionsUpdate,
    request: Request,
    current_user: dict = Depends(require_super_admin)
):
    """Bulk update the granular permissions matrix for a workspace."""
    allowed_modules = [
        "dashboard", "crm", "sales", "whatsapp", "marketing", "automation",
        "finance", "hrms", "support", "projects", "reports", "settings",
        "users", "audit_logs", "integrations", "ecommerce", "inventory"
    ]
    with get_db() as db:
        try:
            for perm in data.permissions:
                if perm.module not in allowed_modules:
                    raise HTTPException(status_code=400, detail=f"Invalid module '{perm.module}'")
                
                can_add_val = 1 if perm.can_add else 0
                can_edit_val = 1 if perm.can_edit else 0
                can_delete_val = 1 if perm.can_delete else 0
                can_view_val = 1 if perm.can_view else 0
                can_full_val = 1 if perm.can_full else 0

                exist_sql = text("""
                    SELECT 1 FROM workspace_permissions 
                    WHERE workspace_id = :ws_id AND module = :module AND feature = :feature
                """)
                exists = db.execute(exist_sql, {"ws_id": workspace_id, "module": perm.module, "feature": perm.feature}).scalar()

                if exists:
                    update_sql = text("""
                        UPDATE workspace_permissions
                        SET can_add = :can_add, can_edit = :can_edit, can_delete = :can_delete, 
                            can_view = :can_view, can_full = :can_full, updated_by = :uid
                        WHERE workspace_id = :ws_id AND module = :module AND feature = :feature
                    """)
                    db.execute(update_sql, {
                        "can_add": can_add_val, "can_edit": can_edit_val, "can_delete": can_delete_val,
                        "can_view": can_view_val, "can_full": can_full_val, "uid": current_user.get("id"),
                        "ws_id": workspace_id, "module": perm.module, "feature": perm.feature
                    })
                else:
                    insert_sql = text("""
                        INSERT INTO workspace_permissions 
                        (workspace_id, module, feature, can_add, can_edit, can_delete, can_view, can_full, updated_by)
                        VALUES (:ws_id, :module, :feature, :can_add, :can_edit, :can_delete, :can_view, :can_full, :uid)
                    """)
                    db.execute(insert_sql, {
                        "ws_id": workspace_id, "module": perm.module, "feature": perm.feature,
                        "can_add": can_add_val, "can_edit": can_edit_val, "can_delete": can_delete_val,
                        "can_view": can_view_val, "can_full": can_full_val, "uid": current_user.get("id")
                    })

            log_saas_event(
                db, workspace_id,
                current_user.get("id", "system"), current_user.get("email", "admin@super.ai"),
                "Permissions Matrix Bulk Updated",
                f"Bulk updated {len(data.permissions)} granular permissions",
                request
            )
            db.commit()
            return {"success": True, "message": "Workspace permissions bulk updated successfully"}
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

