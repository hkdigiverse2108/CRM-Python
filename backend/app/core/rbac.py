"""
Role-Based Access Control and Security Scoping Utility
=====================================================
Calculates user-specific resource scoping (own, team, department, all) for multi-tenant queries.
"""

from sqlalchemy import text
from typing import Any, Dict, List

def get_security_context(db, user_id: str, tenant_id: str, module: str) -> Dict[str, Any]:
    """
    Computes the permitted user/agent IDs and scope for the current user and module.
    
    Returns:
        A dictionary containing:
            - "scope": "own" | "team" | "department" | "all"
            - "user_ids": List[str] containing user IDs permitted for this scope
            - "current_user_id": str (the active user's ID)
    """
    # 1. Fetch user information
    user_sql = text("SELECT email, role_id FROM users WHERE user_id = :user_id AND workspace_id = :tenant_id")
    user_row = db.execute(user_sql, {"user_id": user_id, "tenant_id": tenant_id}).mappings().first()
    if not user_row:
        return {"scope": "own", "user_ids": [user_id], "current_user_id": user_id}

    email = user_row["email"]
    role_id = user_row["role_id"]

    # 2. Check if user is Super Admin or Org Admin
    role_sql = text("SELECT role_name FROM roles WHERE role_id = :role_id")
    role_name = db.execute(role_sql, {"role_id": role_id}).scalar() or ""
    
    if role_name in ("Super Admin", "Organization Admin") or role_id == "admin":
        return {"scope": "all", "user_ids": [], "current_user_id": user_id}

    # 3. Retrieve permission scope for target module
    perm_sql = text("SELECT record_scope FROM role_permissions WHERE role_id = :role_id AND module = :module")
    scope = db.execute(perm_sql, {"role_id": role_id, "module": module}).scalar() or "all"

    if scope == "all":
        return {"scope": "all", "user_ids": [], "current_user_id": user_id}

    # 4. Fetch matching Employee profile to determine Department/Team relationships
    emp_sql = text("SELECT employee_id, department, name, reporting_manager FROM hrms_employees WHERE email = :email AND workspace_id = :tenant_id AND deleted_at IS NULL")
    emp_row = db.execute(emp_sql, {"email": email, "tenant_id": tenant_id}).mappings().first()
    if not emp_row:
        return {"scope": scope, "user_ids": [user_id], "current_user_id": user_id}

    emp_id = emp_row["employee_id"]
    dept = emp_row["department"]
    emp_name = emp_row["name"]
    manager = emp_row["reporting_manager"]

    if scope == "own":
        return {"scope": "own", "user_ids": [user_id], "current_user_id": user_id}

    elif scope == "department":
        if not dept:
            return {"scope": "department", "user_ids": [user_id], "current_user_id": user_id}
        dept_sql = text("""
            SELECT u.user_id 
            FROM users u
            JOIN hrms_employees e ON u.email = e.email
            WHERE e.department = :dept AND u.workspace_id = :tenant_id AND e.deleted_at IS NULL
        """)
        dept_user_ids = db.execute(dept_sql, {"dept": dept, "tenant_id": tenant_id}).scalars().all()
        return {
            "scope": "department", 
            "user_ids": list(dept_user_ids) if dept_user_ids else [user_id], 
            "current_user_id": user_id
        }

    elif scope == "team":
        # Fetch reportees and other agents under the same manager
        team_sql = text("""
            SELECT u.user_id 
            FROM users u
            JOIN hrms_employees e ON u.email = e.email
            WHERE (e.reporting_manager = :emp_name 
                   OR e.reporting_manager = :emp_id
                   OR (e.reporting_manager = :manager AND :manager != '') 
                   OR u.user_id = :user_id)
              AND u.workspace_id = :tenant_id AND e.deleted_at IS NULL
        """)
        team_user_ids = db.execute(team_sql, {
            "emp_name": emp_name,
            "emp_id": emp_id,
            "manager": manager or "",
            "user_id": user_id,
            "tenant_id": tenant_id
        }).scalars().all()
        return {
            "scope": "team", 
            "user_ids": list(team_user_ids) if team_user_ids else [user_id], 
            "current_user_id": user_id
        }

    return {"scope": "own", "user_ids": [user_id], "current_user_id": user_id}
