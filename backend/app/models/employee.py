from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from typing import Optional, List, Dict, Any
import uuid


@dataclass
class Employee:
    """HRMS Employee Entity."""

    employee_id: str = field(default_factory=lambda: f"EMP-{str(uuid.uuid4())[:6].upper()}")
    workspace_id: str = ""
    name: str = ""
    role: str = ""
    department: str = ""
    email: str = ""
    phone: Optional[str] = None
    status: str = "Active"
    gender: str = "Male"
    dob: Optional[date] = None
    blood_group: str = "O+"
    marital_status: str = "Single"
    emergency_contact: Optional[str] = None
    current_address: Optional[str] = None
    permanent_address: Optional[str] = None
    aadhaar_number: Optional[str] = None
    pan_number: Optional[str] = None
    bank_name: str = "HDFC Bank"
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    uan_number: Optional[str] = None
    pf_number: Optional[str] = None
    reporting_manager: Optional[str] = None
    employment_type: str = "Full-Time"
    join_date: Optional[date] = None
    shift_assignment: str = "General Shift"
    work_location: str = "Bangalore Office"
    attendance_status: str = "Present"
    salary_structure: Dict[str, Any] = field(default_factory=dict)
    assets: List[Dict[str, Any]] = field(default_factory=list)
    documents: List[Dict[str, Any]] = field(default_factory=list)
    history: List[Dict[str, Any]] = field(default_factory=list)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.employee_id,
            "employee_id": self.employee_id,
            "tenantId": self.workspace_id,
            "name": self.name,
            "role": self.role,
            "department": self.department,
            "email": self.email,
            "phone": self.phone or "",
            "status": self.status,
            "gender": self.gender,
            "dob": self.dob.isoformat() if self.dob else "",
            "bloodGroup": self.blood_group,
            "maritalStatus": self.marital_status,
            "emergencyContact": self.emergency_contact or "",
            "currentAddress": self.current_address or "",
            "permanentAddress": self.permanent_address or "",
            "aadhaarNumber": self.aadhaar_number or "",
            "panNumber": self.pan_number or "",
            "bankName": self.bank_name,
            "accountNumber": self.account_number or "",
            "ifscCode": self.ifsc_code or "",
            "uanNumber": self.uan_number or "",
            "pfNumber": self.pf_number or "",
            "reportingManager": self.reporting_manager or "",
            "employmentType": self.employment_type,
            "joinDate": self.join_date.isoformat() if self.join_date else "",
            "shiftAssignment": self.shift_assignment,
            "workLocation": self.work_location,
            "attendanceStatus": self.attendance_status,
            "salaryStructure": self.salary_structure or {},
            "assets": self.assets or [],
            "documents": self.documents or [],
            "history": self.history or [],
            "createdAt": self.created_at.isoformat() if self.created_at else "",
            "updatedAt": self.updated_at.isoformat() if self.updated_at else "",
        }
