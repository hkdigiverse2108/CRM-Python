from typing import Any, Optional, Dict
from fastapi import HTTPException
from datetime import datetime, timezone

from backend.app.models.employee import Employee
from backend.app.repositories.employee_repo import EmployeeRepository, get_employee_repository


class EmployeeService:
    def __init__(self, employee_repo: EmployeeRepository):
        self.employee_repo = employee_repo

    async def get_employee(self, employee_id: str, tenant_id: str) -> Dict[str, Any]:
        employee = await self.employee_repo.get_by_id(employee_id, tenant_id)
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        return employee.to_dict()

    async def list_employees(
        self, tenant_id: str, filters: Optional[dict[str, Any]] = None, page: int = 1, per_page: int = 100
    ) -> Dict[str, Any]:
        skip = (page - 1) * per_page
        employees = await self.employee_repo.get_all(tenant_id, filters, skip, per_page)
        total = await self.employee_repo.count(tenant_id, filters)
        return {
            "items": [emp.to_dict() for emp in employees],
            "meta": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": (total + per_page - 1) // per_page if total > 0 else 0,
            },
        }

    async def create_employee(self, data: dict[str, Any], tenant_id: str) -> Dict[str, Any]:
        dob = data.get("dob")
        join_date = data.get("joinDate")

        bank_details = data.get("bankDetails") or {}
        bank_name = bank_details.get("bankName") or "HDFC Bank"
        account_number = bank_details.get("accountNumber")
        ifsc_code = bank_details.get("ifscCode")

        salary_schema = data.get("salaryStructure") or {}
        salary_structure = {
            "basic": float(salary_schema.get("basic") or 0.0),
            "hra": float(salary_schema.get("hra") or 0.0),
            "allowances": float(salary_schema.get("allowances") or 0.0),
            "incentives": float(salary_schema.get("incentives") or 0.0),
            "bonus": float(salary_schema.get("bonus") or 0.0),
            "pf": float(salary_schema.get("pf") or 0.0),
            "esi": float(salary_schema.get("esi") or 0.0),
            "tds": float(salary_schema.get("tds") or 0.0),
            "loanDeductions": float(salary_schema.get("loanDeductions") or 0.0),
        }

        # Initialize Employee entity
        employee = Employee(
            workspace_id=tenant_id,
            name=data["name"],
            role=data["role"],
            department=data["department"],
            email=data["email"],
            phone=data.get("phone"),
            status=data.get("status") or "Active",
            gender=data.get("gender") or "Male",
            dob=dob,
            blood_group=data.get("bloodGroup") or "O+",
            marital_status=data.get("maritalStatus") or "Single",
            emergency_contact=data.get("emergencyContact"),
            current_address=data.get("currentAddress"),
            permanent_address=data.get("permanentAddress"),
            aadhaar_number=data.get("aadhaarNumber"),
            pan_number=data.get("panNumber"),
            bank_name=bank_name,
            account_number=account_number,
            ifsc_code=ifsc_code,
            uan_number=data.get("uanNumber"),
            pf_number=data.get("pfNumber"),
            reporting_manager=data.get("reportingManager"),
            employment_type=data.get("employmentType") or "Full-Time",
            join_date=join_date,
            shift_assignment=data.get("shiftAssignment") or "General Shift",
            work_location=data.get("workLocation") or "Bangalore Office",
            attendance_status=data.get("attendanceStatus") or "Present",
            salary_structure=salary_structure,
            assets=data.get("assets") or [],
            documents=data.get("documents") or [],
            history=data.get("history") or [],
        )

        if data.get("id"):
            employee.employee_id = data["id"]

        created_employee = await self.employee_repo.create(employee)

        # Synced user creation in users table
        email = data.get("email")
        password = data.get("password") or "Temp1234!"  # Default fallback password
        role_designation = data.get("role") or "Sales Executive"
        name = data.get("name")
        phone = data.get("phone")

        # Resolve role_id in database matching role designation
        from backend.app.core.database import get_db
        from sqlalchemy import text
        db_role_id = f"role_agent_001_{tenant_id}"  # default fallback
        try:
            with get_db() as db:
                sql = text("SELECT role_id FROM roles WHERE LOWER(role_name) = :role_name AND workspace_id = :tenant_id")
                r_id = db.execute(sql, {"role_name": role_designation.lower().strip(), "tenant_id": tenant_id}).scalar()
                if r_id:
                    db_role_id = r_id
                else:
                    rd_lower = role_designation.lower()
                    if "super" in rd_lower and "admin" in rd_lower:
                        db_role_id = f"role_super_admin_{tenant_id}"
                    elif "admin" in rd_lower:
                        db_role_id = f"role_admin_001_{tenant_id}"
                    elif "manager" in rd_lower or "mgr" in rd_lower:
                        if "sales" in rd_lower:
                            db_role_id = f"role_mgr_001_{tenant_id}"
                        elif "marketing" in rd_lower:
                            db_role_id = f"role_marketing_mgr_{tenant_id}"
                        elif "hr" in rd_lower:
                            db_role_id = f"role_hr_mgr_{tenant_id}"
                        elif "support" in rd_lower:
                            db_role_id = f"role_support_mgr_{tenant_id}"
                        elif "project" in rd_lower:
                            db_role_id = f"role_project_mgr_{tenant_id}"
                        elif "operations" in rd_lower:
                            db_role_id = f"role_operations_mgr_{tenant_id}"
                        else:
                            db_role_id = f"role_mgr_001_{tenant_id}"
                    elif "executive" in rd_lower or "exec" in rd_lower:
                        if "sales" in rd_lower:
                            db_role_id = f"role_agent_001_{tenant_id}"
                        elif "marketing" in rd_lower:
                            db_role_id = f"role_marketing_exec_{tenant_id}"
                        elif "hr" in rd_lower:
                            db_role_id = f"role_hr_exec_{tenant_id}"
                        elif "support" in rd_lower:
                            db_role_id = f"role_support_001_{tenant_id}"
                    elif "accountant" in rd_lower:
                        db_role_id = f"role_accountant_001_{tenant_id}"
                    elif "member" in rd_lower:
                        db_role_id = f"role_team_member_{tenant_id}"
                    elif "inventory" in rd_lower:
                        db_role_id = f"role_inventory_mgr_{tenant_id}"
                    elif "call" in rd_lower:
                        db_role_id = f"role_call_center_agent_{tenant_id}"
                    elif "whatsapp" in rd_lower:
                        db_role_id = f"role_whatsapp_agent_{tenant_id}"
                    elif "receptionist" in rd_lower:
                        db_role_id = f"role_receptionist_{tenant_id}"
        except Exception as e:
            print(f"[!] Resolving role ID for employee failed: {e}")

        from backend.app.services.auth_service import get_auth_service
        try:
            auth_service = get_auth_service()
            await auth_service.register(
                email=email,
                password=password,
                full_name=name,
                role=db_role_id,
                tenant_id=tenant_id,
                phone=phone
            )
        except Exception as e:
            print(f"[!] Syncing user for employee failed (likely already exists): {e}")

        return created_employee.to_dict()

    async def update_employee(self, employee_id: str, tenant_id: str, data: dict[str, Any]) -> Dict[str, Any]:
        employee = await self.employee_repo.get_by_id(employee_id, tenant_id)
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")

        updated_employee = await self.employee_repo.update(employee_id, tenant_id, data)
        if not updated_employee:
            raise HTTPException(status_code=404, detail="Employee update failed")

        # Update synced user
        email = data.get("email")
        role = data.get("role")
        name = data.get("name")
        phone = data.get("phone")
        
        # Resolve role_id in database matching updated role designation
        db_role_id = None
        if role:
            from backend.app.core.database import get_db
            from sqlalchemy import text
            try:
                with get_db() as db:
                    sql = text("SELECT role_id FROM roles WHERE LOWER(role_name) = :role_name AND workspace_id = :tenant_id")
                    r_id = db.execute(sql, {"role_name": role.lower().strip(), "tenant_id": tenant_id}).scalar()
                    if r_id:
                        db_role_id = r_id
                    else:
                        rd_lower = role.lower()
                        if "super" in rd_lower and "admin" in rd_lower:
                            db_role_id = f"role_super_admin_{tenant_id}"
                        elif "admin" in rd_lower:
                            db_role_id = f"role_admin_001_{tenant_id}"
                        elif "manager" in rd_lower or "mgr" in rd_lower:
                            if "sales" in rd_lower:
                                db_role_id = f"role_mgr_001_{tenant_id}"
                            elif "marketing" in rd_lower:
                                db_role_id = f"role_marketing_mgr_{tenant_id}"
                            elif "hr" in rd_lower:
                                db_role_id = f"role_hr_mgr_{tenant_id}"
                            elif "support" in rd_lower:
                                db_role_id = f"role_support_mgr_{tenant_id}"
                            elif "project" in rd_lower:
                                db_role_id = f"role_project_mgr_{tenant_id}"
                            elif "operations" in rd_lower:
                                db_role_id = f"role_operations_mgr_{tenant_id}"
                            else:
                                db_role_id = f"role_mgr_001_{tenant_id}"
                        elif "executive" in rd_lower or "exec" in rd_lower:
                            if "sales" in rd_lower:
                                db_role_id = f"role_agent_001_{tenant_id}"
                            elif "marketing" in rd_lower:
                                db_role_id = f"role_marketing_exec_{tenant_id}"
                            elif "hr" in rd_lower:
                                db_role_id = f"role_hr_exec_{tenant_id}"
                            elif "support" in rd_lower:
                                db_role_id = f"role_support_001_{tenant_id}"
                        elif "accountant" in rd_lower:
                            db_role_id = f"role_accountant_001_{tenant_id}"
                        elif "member" in rd_lower:
                            db_role_id = f"role_team_member_{tenant_id}"
                        elif "inventory" in rd_lower:
                            db_role_id = f"role_inventory_mgr_{tenant_id}"
                        elif "call" in rd_lower:
                            db_role_id = f"role_call_center_agent_{tenant_id}"
                        elif "whatsapp" in rd_lower:
                            db_role_id = f"role_whatsapp_agent_{tenant_id}"
                        elif "receptionist" in rd_lower:
                            db_role_id = f"role_receptionist_{tenant_id}"
            except Exception as e:
                print(f"[!] Resolving role ID for employee update failed: {e}")

        from backend.app.repositories.user_repo import get_user_repository
        try:
            user_repo = get_user_repository()
            user = await user_repo.get_by_email(employee.email, tenant_id)
            if user:
                update_payload = {}
                if email:
                    update_payload["email"] = email
                if db_role_id:
                    update_payload["role"] = db_role_id
                if name:
                    update_payload["full_name"] = name
                if phone:
                    update_payload["phone"] = phone
                if update_payload:
                    await user_repo.update(user.id, tenant_id, update_payload)
        except Exception as e:
            print(f"[!] Syncing user update for employee failed: {e}")

        return updated_employee.to_dict()

    async def delete_employee(self, employee_id: str, tenant_id: str) -> None:
        employee = await self.employee_repo.get_by_id(employee_id, tenant_id)
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        # Soft delete or deactivate corresponding user
        from backend.app.repositories.user_repo import get_user_repository
        try:
            user_repo = get_user_repository()
            user = await user_repo.get_by_email(employee.email, tenant_id)
            if user:
                await user_repo.delete(user.id, tenant_id)
        except Exception as e:
            print(f"[!] Syncing user delete for employee failed: {e}")

        await self.employee_repo.delete(employee_id, tenant_id)


_employee_service = EmployeeService(get_employee_repository())

def get_employee_service() -> EmployeeService:
    return _employee_service
