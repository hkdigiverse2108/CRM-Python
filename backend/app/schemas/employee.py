import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class SalaryStructureSchema(BaseModel):
    basic: float = 0.0
    hra: float = 0.0
    allowances: float = 0.0
    incentives: float = 0.0
    bonus: float = 0.0
    pf: float = 0.0
    esi: float = 0.0
    tds: float = 0.0
    loanDeductions: float = 0.0


class BankDetailsSchema(BaseModel):
    bankName: str = "HDFC Bank"
    accountNumber: str = ""
    ifscCode: str = ""


class EmployeeCreate(BaseModel):
    id: Optional[str] = None
    name: str = Field(..., min_length=1)
    role: str = Field(..., min_length=1)
    department: str = Field(..., min_length=1)
    email: str = Field(..., min_length=1)
    phone: Optional[str] = None
    status: Optional[str] = "Active"
    password: Optional[str] = None
    gender: Optional[str] = "Male"
    dob: Optional[datetime.date] = None
    bloodGroup: Optional[str] = "O+"
    maritalStatus: Optional[str] = "Single"
    emergencyContact: Optional[str] = None
    currentAddress: Optional[str] = None
    permanentAddress: Optional[str] = None
    aadhaarNumber: Optional[str] = None
    panNumber: Optional[str] = None
    bankDetails: Optional[BankDetailsSchema] = None
    uanNumber: Optional[str] = None
    pfNumber: Optional[str] = None
    reportingManager: Optional[str] = None
    employmentType: Optional[str] = "Full-Time"
    joinDate: Optional[datetime.date] = None
    shiftAssignment: Optional[str] = "General Shift"
    workLocation: Optional[str] = "Bangalore Office"
    attendanceStatus: Optional[str] = "Present"
    salaryStructure: Optional[SalaryStructureSchema] = None
    assets: Optional[List[Dict[str, Any]]] = None
    documents: Optional[List[Dict[str, Any]]] = None
    history: Optional[List[Dict[str, Any]]] = None


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    password: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[datetime.date] = None
    bloodGroup: Optional[str] = None
    maritalStatus: Optional[str] = None
    emergencyContact: Optional[str] = None
    currentAddress: Optional[str] = None
    permanentAddress: Optional[str] = None
    aadhaarNumber: Optional[str] = None
    panNumber: Optional[str] = None
    bankDetails: Optional[BankDetailsSchema] = None
    uanNumber: Optional[str] = None
    pfNumber: Optional[str] = None
    reportingManager: Optional[str] = None
    employmentType: Optional[str] = None
    joinDate: Optional[datetime.date] = None
    shiftAssignment: Optional[str] = None
    workLocation: Optional[str] = None
    attendanceStatus: Optional[str] = None
    salaryStructure: Optional[SalaryStructureSchema] = None
    assets: Optional[List[Dict[str, Any]]] = None
    documents: Optional[List[Dict[str, Any]]] = None
    history: Optional[List[Dict[str, Any]]] = None
