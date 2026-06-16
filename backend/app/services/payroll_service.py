from typing import Any, Optional, Dict
from fastapi import HTTPException
from datetime import datetime, timezone

from backend.app.models.payroll import Payroll
from backend.app.repositories.payroll_repo import PayrollRepository, get_payroll_repository
from backend.app.repositories.employee_repo import get_employee_repository


class PayrollService:
    def __init__(self, payroll_repo: PayrollRepository):
        self.payroll_repo = payroll_repo

    async def get_payroll(self, payroll_id: str, tenant_id: str) -> Dict[str, Any]:
        pr = await self.payroll_repo.get_by_id(payroll_id, tenant_id)
        if not pr:
            raise HTTPException(status_code=404, detail="Payroll record not found")
        return pr.to_dict()

    async def list_payroll(
        self, tenant_id: str, filters: Optional[dict[str, Any]] = None, page: int = 1, per_page: int = 100
    ) -> Dict[str, Any]:
        skip = (page - 1) * per_page
        records = await self.payroll_repo.get_all(tenant_id, filters, skip, per_page)
        total = await self.payroll_repo.count(tenant_id, filters)
        return {
            "items": [rec.to_dict() for rec in records],
            "meta": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": (total + per_page - 1) // per_page if total > 0 else 0,
            },
        }

    async def process_payroll_month(self, month: str, tenant_id: str) -> list[Dict[str, Any]]:
        # 1. Fetch all active employees
        emp_repo = get_employee_repository()
        employees = await emp_repo.get_all(tenant_id, filters={"status": "Active"})

        results = []
        for emp in employees:
            # Check if payroll already exists for this employee and month
            existing = await self.payroll_repo.get_by_employee_and_month(emp.employee_id, month, tenant_id)
            if existing:
                results.append(existing.to_dict())
                continue

            # Read salary structure
            sal = emp.salary_structure or {}
            basic = float(sal.get("basic") or 45000.0)
            hra = float(sal.get("hra") or 18000.0)
            allowances = float(sal.get("allowances") or 7000.0)
            incentives = float(sal.get("incentives") or 0.0)
            bonus = float(sal.get("bonus") or 0.0)
            pf = float(sal.get("pf") or 1800.0)
            esi = float(sal.get("esi") or 0.0)
            tds = float(sal.get("tds") or 2500.0)
            loan_ded = float(sal.get("loanDeductions") or 0.0)

            # Compute gross & net
            gross_pay = basic + hra + allowances + incentives + bonus
            total_deductions = pf + esi + tds + loan_ded
            net_pay = gross_pay - total_deductions

            # Create payroll record
            payroll = Payroll(
                workspace_id=tenant_id,
                employee_id=emp.employee_id,
                employee_name=emp.name,
                department=emp.department,
                designation=emp.role,
                month=month,
                basic=basic,
                hra=hra,
                allowances=allowances,
                incentives=incentives,
                bonus=bonus,
                pf=pf,
                esi=esi,
                tds=tds,
                loan_deductions=loan_ded,
                gross_pay=gross_pay,
                total_deductions=total_deductions,
                net_pay=net_pay,
                status="Pending",
            )
            created = await self.payroll_repo.create(payroll)
            results.append(created.to_dict())

        return results

    async def create_payroll(self, data: dict[str, Any], tenant_id: str) -> Dict[str, Any]:
        employee_id = data["employeeId"]
        emp_repo = get_employee_repository()
        employee = await emp_repo.get_by_id(employee_id, tenant_id)
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")

        basic = float(data.get("basic") or 0.0)
        hra = float(data.get("hra") or 0.0)
        allowances = float(data.get("allowances") or 0.0)
        incentives = float(data.get("incentives") or 0.0)
        bonus = float(data.get("bonus") or 0.0)
        pf = float(data.get("pf") or 0.0)
        esi = float(data.get("esi") or 0.0)
        tds = float(data.get("tds") or 0.0)
        loan_deductions = float(data.get("loanDeductions") or 0.0)

        gross_pay = basic + hra + allowances + incentives + bonus
        total_deductions = pf + esi + tds + loan_deductions
        net_pay = gross_pay - total_deductions

        payroll = Payroll(
            workspace_id=tenant_id,
            employee_id=employee_id,
            employee_name=employee.name,
            department=employee.department,
            designation=employee.role,
            month=data["month"],
            basic=basic,
            hra=hra,
            allowances=allowances,
            incentives=incentives,
            bonus=bonus,
            pf=pf,
            esi=esi,
            tds=tds,
            loan_deductions=loan_deductions,
            gross_pay=gross_pay,
            total_deductions=total_deductions,
            net_pay=net_pay,
            status=data.get("status") or "Pending",
        )

        created = await self.payroll_repo.create(payroll)
        return created.to_dict()

    async def update_payroll(self, payroll_id: str, tenant_id: str, data: dict[str, Any]) -> Dict[str, Any]:
        payroll = await self.payroll_repo.get_by_id(payroll_id, tenant_id)
        if not payroll:
            raise HTTPException(status_code=404, detail="Payroll record not found")

        # Recalculate if totals are impacted
        recompute = False
        basic = data.get("basic") if "basic" in data else payroll.basic
        hra = data.get("hra") if "hra" in data else payroll.hra
        allowances = data.get("allowances") if "allowances" in data else payroll.allowances
        incentives = data.get("incentives") if "incentives" in data else payroll.incentives
        bonus = data.get("bonus") if "bonus" in data else payroll.bonus
        pf = data.get("pf") if "pf" in data else payroll.pf
        esi = data.get("esi") if "esi" in data else payroll.esi
        tds = data.get("tds") if "tds" in data else payroll.tds
        loan_ded = data.get("loanDeductions") if "loanDeductions" in data else payroll.loan_deductions

        gross_pay = basic + hra + allowances + incentives + bonus
        total_deductions = pf + esi + tds + loan_ded
        net_pay = gross_pay - total_deductions

        data["grossPay"] = gross_pay
        data["totalDeductions"] = total_deductions
        data["netPay"] = net_pay

        updated = await self.payroll_repo.update(payroll_id, tenant_id, data)
        return updated.to_dict()

    async def delete_payroll(self, payroll_id: str, tenant_id: str) -> None:
        payroll = await self.payroll_repo.get_by_id(payroll_id, tenant_id)
        if not payroll:
            raise HTTPException(status_code=404, detail="Payroll record not found")
        await self.payroll_repo.delete(payroll_id, tenant_id)


_payroll_service = PayrollService(get_payroll_repository())

def get_payroll_service() -> PayrollService:
    return _payroll_service
