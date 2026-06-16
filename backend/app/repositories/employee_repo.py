import uuid
import json
from datetime import datetime, date, timezone
from typing import Any, Optional
import anyio
from sqlalchemy import text

from backend.app.models.employee import Employee
from backend.app.repositories.base import BaseRepository
from backend.app.core.database import get_db


class EmployeeRepository(BaseRepository[Employee]):
    """
    MySQL database repository for HRMS employees.
    Filters all queries by workspace_id to guarantee tenant data isolation.
    """

    def _row_to_employee(self, row: dict[str, Any]) -> Employee:
        """Helper to construct an Employee domain model from a database row."""
        created_at = row["created_at"]
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        elif created_at and not created_at.tzinfo:
            created_at = created_at.replace(tzinfo=timezone.utc)

        updated_at = row["updated_at"]
        if isinstance(updated_at, str):
            updated_at = datetime.fromisoformat(updated_at)
        elif updated_at and not updated_at.tzinfo:
            updated_at = updated_at.replace(tzinfo=timezone.utc)

        salary_structure = {}
        if row.get("salary_structure"):
            try:
                salary_structure = json.loads(row["salary_structure"]) if isinstance(row["salary_structure"], str) else row["salary_structure"]
            except Exception:
                salary_structure = {}

        assets = []
        if row.get("assets"):
            try:
                assets = json.loads(row["assets"]) if isinstance(row["assets"], str) else row["assets"]
            except Exception:
                assets = []

        documents = []
        if row.get("documents"):
            try:
                documents = json.loads(row["documents"]) if isinstance(row["documents"], str) else row["documents"]
            except Exception:
                documents = []

        history = []
        if row.get("history"):
            try:
                history = json.loads(row["history"]) if isinstance(row["history"], str) else row["history"]
            except Exception:
                history = []

        return Employee(
            employee_id=row["employee_id"],
            workspace_id=row["workspace_id"],
            name=row["name"],
            role=row["role"],
            department=row["department"],
            email=row["email"],
            phone=row.get("phone"),
            status=row.get("status") or "Active",
            gender=row.get("gender") or "Male",
            dob=row.get("dob"),
            blood_group=row.get("blood_group") or "O+",
            marital_status=row.get("marital_status") or "Single",
            emergency_contact=row.get("emergency_contact"),
            current_address=row.get("current_address"),
            permanent_address=row.get("permanent_address"),
            aadhaar_number=row.get("aadhaar_number"),
            pan_number=row.get("pan_number"),
            bank_name=row.get("bank_name") or "HDFC Bank",
            account_number=row.get("account_number"),
            ifsc_code=row.get("ifsc_code"),
            uan_number=row.get("uan_number"),
            pf_number=row.get("pf_number"),
            reporting_manager=row.get("reporting_manager"),
            employment_type=row.get("employment_type") or "Full-Time",
            join_date=row.get("join_date"),
            shift_assignment=row.get("shift_assignment") or "General Shift",
            work_location=row.get("work_location") or "Bangalore Office",
            attendance_status=row.get("attendance_status") or "Present",
            salary_structure=salary_structure,
            assets=assets,
            documents=documents,
            history=history,
            created_at=created_at or datetime.now(timezone.utc),
            updated_at=updated_at or datetime.now(timezone.utc),
        )

    async def get_by_id(self, entity_id: str, tenant_id: str) -> Optional[Employee]:
        def _get():
            with get_db() as db:
                sql = text("""
                    SELECT * FROM hrms_employees 
                    WHERE employee_id = :employee_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {"employee_id": entity_id, "workspace_id": tenant_id}).mappings().first()
                if not res:
                    return None
                return self._row_to_employee(res)
        return await anyio.to_thread.run_sync(_get)

    async def get_all(
        self, tenant_id: str, filters: Optional[dict[str, Any]] = None,
        skip: int = 0, limit: int = 100,
    ) -> list[Employee]:
        def _get_all():
            with get_db() as db:
                query_str = """
                    SELECT * FROM hrms_employees 
                    WHERE workspace_id = :workspace_id AND deleted_at IS NULL
                """
                params = {"workspace_id": tenant_id}
                if filters:
                    if "status" in filters:
                        query_str += " AND status = :status"
                        params["status"] = filters["status"]
                    if "department" in filters:
                        query_str += " AND department = :department"
                        params["department"] = filters["department"]
                    if "search" in filters and filters["search"]:
                        search_term = filters["search"].strip()[:100]
                        if search_term:
                            query_str += " AND MATCH(name, email, role) AGAINST(:search IN NATURAL LANGUAGE MODE)"
                            params["search"] = search_term

                query_str += " ORDER BY created_at DESC LIMIT :limit OFFSET :skip"
                params["limit"] = limit
                params["skip"] = skip

                res = db.execute(text(query_str), params).mappings().all()
                return [self._row_to_employee(r) for r in res]
        return await anyio.to_thread.run_sync(_get_all)

    async def create(self, entity: Employee) -> Employee:
        def _create():
            with get_db() as db:
                sql = text("""
                    INSERT INTO hrms_employees (
                        employee_id, workspace_id, name, role, department, email, phone, status,
                        gender, dob, blood_group, marital_status, emergency_contact,
                        current_address, permanent_address, aadhaar_number, pan_number,
                        bank_name, account_number, ifsc_code, uan_number, pf_number,
                        reporting_manager, employment_type, join_date, shift_assignment,
                        work_location, attendance_status, salary_structure, assets,
                        documents, history, created_at, updated_at
                    ) VALUES (
                        :employee_id, :workspace_id, :name, :role, :department, :email, :phone, :status,
                        :gender, :dob, :blood_group, :marital_status, :emergency_contact,
                        :current_address, :permanent_address, :aadhaar_number, :pan_number,
                        :bank_name, :account_number, :ifsc_code, :uan_number, :pf_number,
                        :reporting_manager, :employment_type, :join_date, :shift_assignment,
                        :work_location, :attendance_status, :salary_structure, :assets,
                        :documents, :history, :created_at, :updated_at
                    )
                """)
                db.execute(sql, {
                    "employee_id": entity.employee_id,
                    "workspace_id": entity.workspace_id,
                    "name": entity.name,
                    "role": entity.role,
                    "department": entity.department,
                    "email": entity.email,
                    "phone": entity.phone,
                    "status": entity.status,
                    "gender": entity.gender,
                    "dob": entity.dob,
                    "blood_group": entity.blood_group,
                    "marital_status": entity.marital_status,
                    "emergency_contact": entity.emergency_contact,
                    "current_address": entity.current_address,
                    "permanent_address": entity.permanent_address,
                    "aadhaar_number": entity.aadhaar_number,
                    "pan_number": entity.pan_number,
                    "bank_name": entity.bank_name,
                    "account_number": entity.account_number,
                    "ifsc_code": entity.ifsc_code,
                    "uan_number": entity.uan_number,
                    "pf_number": entity.pf_number,
                    "reporting_manager": entity.reporting_manager,
                    "employment_type": entity.employment_type,
                    "join_date": entity.join_date,
                    "shift_assignment": entity.shift_assignment,
                    "work_location": entity.work_location,
                    "attendance_status": entity.attendance_status,
                    "salary_structure": json.dumps(entity.salary_structure),
                    "assets": json.dumps(entity.assets),
                    "documents": json.dumps(entity.documents),
                    "history": json.dumps(entity.history),
                    "created_at": entity.created_at,
                    "updated_at": entity.updated_at,
                })
                db.commit()
                return entity
        return await anyio.to_thread.run_sync(_create)

    async def update(self, entity_id: str, tenant_id: str, data: dict[str, Any]) -> Optional[Employee]:
        def _update():
            with get_db() as db:
                set_clauses = []
                params = {"employee_id": entity_id, "workspace_id": tenant_id}

                # Mapping camelCase frontend parameters or fields to DB columns
                field_map = {
                    "name": "name",
                    "role": "role",
                    "department": "department",
                    "email": "email",
                    "phone": "phone",
                    "status": "status",
                    "gender": "gender",
                    "dob": "dob",
                    "bloodGroup": "blood_group",
                    "maritalStatus": "marital_status",
                    "emergencyContact": "emergency_contact",
                    "currentAddress": "current_address",
                    "permanentAddress": "permanent_address",
                    "aadhaarNumber": "aadhaar_number",
                    "panNumber": "pan_number",
                    "bankDetails": "bank_details",  # Special mapping logic below
                    "bankName": "bank_name",
                    "accountNumber": "account_number",
                    "ifscCode": "ifsc_code",
                    "uanNumber": "uan_number",
                    "pfNumber": "pf_number",
                    "reportingManager": "reporting_manager",
                    "employmentType": "employment_type",
                    "joinDate": "join_date",
                    "shiftAssignment": "shift_assignment",
                    "workLocation": "work_location",
                    "attendanceStatus": "attendance_status",
                    "salaryStructure": "salary_structure",
                    "assets": "assets",
                    "documents": "documents",
                    "history": "history",
                }

                for key, val in data.items():
                    if key == "bankDetails" and val:
                        # Extract bankName, accountNumber, ifscCode
                        if "bankName" in val:
                            set_clauses.append("bank_name = :bank_name")
                            params["bank_name"] = val["bankName"]
                        if "accountNumber" in val:
                            set_clauses.append("account_number = :account_number")
                            params["account_number"] = val["accountNumber"]
                        if "ifscCode" in val:
                            set_clauses.append("ifsc_code = :ifsc_code")
                            params["ifsc_code"] = val["ifscCode"]
                        continue

                    db_col = field_map.get(key, key)
                    if db_col in ["salary_structure", "assets", "documents", "history"]:
                        set_clauses.append(f"{db_col} = :{db_col}")
                        params[db_col] = json.dumps(val) if val is not None else None
                    elif db_col in field_map.values():
                        set_clauses.append(f"{db_col} = :{db_col}")
                        params[db_col] = val

                if not set_clauses:
                    return None

                set_clauses.append("updated_at = :updated_at")
                params["updated_at"] = datetime.now(timezone.utc)

                sql = text(f"""
                    UPDATE hrms_employees 
                    SET {", ".join(set_clauses)}
                    WHERE employee_id = :employee_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, params)
                db.commit()

                if res.rowcount == 0:
                    return None

        await anyio.to_thread.run_sync(_update)
        return await self.get_by_id(entity_id, tenant_id)

    async def delete(self, entity_id: str, tenant_id: str) -> bool:
        def _delete():
            with get_db() as db:
                sql = text("""
                    UPDATE hrms_employees 
                    SET deleted_at = :deleted_at 
                    WHERE employee_id = :employee_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {
                    "employee_id": entity_id,
                    "workspace_id": tenant_id,
                    "deleted_at": datetime.now(timezone.utc),
                })
                db.commit()
                return res.rowcount > 0
        return await anyio.to_thread.run_sync(_delete)

    async def count(self, tenant_id: str, filters: Optional[dict[str, Any]] = None) -> int:
        def _count():
            with get_db() as db:
                query_str = "SELECT COUNT(*) FROM hrms_employees WHERE workspace_id = :workspace_id AND deleted_at IS NULL"
                params = {"workspace_id": tenant_id}
                if filters:
                    if "status" in filters:
                        query_str += " AND status = :status"
                        params["status"] = filters["status"]
                    if "department" in filters:
                        query_str += " AND department = :department"
                        params["department"] = filters["department"]

                res = db.execute(text(query_str), params).scalar()
                return res or 0
        return await anyio.to_thread.run_sync(_count)


_employee_repo = EmployeeRepository()

def get_employee_repository() -> EmployeeRepository:
    return _employee_repo
