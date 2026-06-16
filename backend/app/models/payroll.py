from dataclasses import dataclass, field
from datetime import datetime, timezone
import uuid


@dataclass
class Payroll:
    """HRMS Payroll Entity."""

    payroll_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    workspace_id: str = ""
    employee_id: str = ""
    employee_name: str = ""
    department: str = ""
    designation: str = ""
    month: str = ""  # Format: "YYYY-MM" or "Month YYYY"
    basic: float = 0.0
    hra: float = 0.0
    allowances: float = 0.0
    incentives: float = 0.0
    bonus: float = 0.0
    pf: float = 0.0
    esi: float = 0.0
    tds: float = 0.0
    loan_deductions: float = 0.0
    gross_pay: float = 0.0
    total_deductions: float = 0.0
    net_pay: float = 0.0
    status: str = "Pending"
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.payroll_id,
            "tenantId": self.workspace_id,
            "employeeId": self.employee_id,
            "employeeName": self.employee_name,
            "department": self.department,
            "designation": self.designation,
            "month": self.month,
            "basic": self.basic,
            "hra": self.hra,
            "allowances": self.allowances,
            "incentives": self.incentives,
            "bonus": self.bonus,
            "pf": self.pf,
            "esi": self.esi,
            "tds": self.tds,
            "loanDeductions": self.loan_deductions,
            "grossPay": self.gross_pay,
            "totalDeductions": self.total_deductions,
            "netPay": self.net_pay,
            "status": self.status,
            "createdAt": self.created_at.isoformat() if self.created_at else "",
            "updatedAt": self.updated_at.isoformat() if self.updated_at else "",
        }
