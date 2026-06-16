from typing import Optional
from pydantic import BaseModel, Field


class PayrollCreate(BaseModel):
    employeeId: str = Field(..., min_length=1)
    employeeName: str = Field(..., min_length=1)
    department: str = Field(..., min_length=1)
    designation: str = Field(..., min_length=1)
    month: str = Field(..., min_length=1)  # e.g., "2026-06"
    basic: Optional[float] = 0.0
    hra: Optional[float] = 0.0
    allowances: Optional[float] = 0.0
    incentives: Optional[float] = 0.0
    bonus: Optional[float] = 0.0
    pf: Optional[float] = 0.0
    esi: Optional[float] = 0.0
    tds: Optional[float] = 0.0
    loanDeductions: Optional[float] = 0.0
    status: Optional[str] = "Pending"


class PayrollUpdate(BaseModel):
    status: Optional[str] = None
    basic: Optional[float] = None
    hra: Optional[float] = None
    allowances: Optional[float] = None
    incentives: Optional[float] = None
    bonus: Optional[float] = None
    pf: Optional[float] = None
    esi: Optional[float] = None
    tds: Optional[float] = None
    loanDeductions: Optional[float] = None
