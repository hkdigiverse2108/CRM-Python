import uuid
from datetime import datetime, timezone
from typing import Any, Optional
import anyio
from sqlalchemy import text

from backend.app.models.payroll import Payroll
from backend.app.repositories.base import BaseRepository
from backend.app.core.database import get_db


class PayrollRepository(BaseRepository[Payroll]):
    """
    MySQL database repository for HRMS Payroll slips.
    Filters all queries by workspace_id.
    """

    def _row_to_payroll(self, row: dict[str, Any]) -> Payroll:
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

        return Payroll(
            payroll_id=row["payroll_id"],
            workspace_id=row["workspace_id"],
            employee_id=row["employee_id"],
            employee_name=row["employee_name"],
            department=row["department"],
            designation=row["designation"],
            month=row["month"],
            basic=float(row.get("basic") or 0.0),
            hra=float(row.get("hra") or 0.0),
            allowances=float(row.get("allowances") or 0.0),
            incentives=float(row.get("incentives") or 0.0),
            bonus=float(row.get("bonus") or 0.0),
            pf=float(row.get("pf") or 0.0),
            esi=float(row.get("esi") or 0.0),
            tds=float(row.get("tds") or 0.0),
            loan_deductions=float(row.get("loan_deductions") or 0.0),
            gross_pay=float(row.get("gross_pay") or 0.0),
            total_deductions=float(row.get("total_deductions") or 0.0),
            net_pay=float(row.get("net_pay") or 0.0),
            status=row.get("status") or "Pending",
            created_at=created_at or datetime.now(timezone.utc),
            updated_at=updated_at or datetime.now(timezone.utc),
        )

    async def get_by_id(self, entity_id: str, tenant_id: str) -> Optional[Payroll]:
        def _get():
            with get_db() as db:
                sql = text("""
                    SELECT * FROM hrms_payroll 
                    WHERE payroll_id = :payroll_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {"payroll_id": entity_id, "workspace_id": tenant_id}).mappings().first()
                if not res:
                    return None
                return self._row_to_payroll(res)
        return await anyio.to_thread.run_sync(_get)

    async def get_by_employee_and_month(self, employee_id: str, month: str, tenant_id: str) -> Optional[Payroll]:
        def _get():
            with get_db() as db:
                sql = text("""
                    SELECT * FROM hrms_payroll 
                    WHERE employee_id = :employee_id AND month = :month AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {
                    "employee_id": employee_id,
                    "month": month,
                    "workspace_id": tenant_id
                }).mappings().first()
                if not res:
                    return None
                return self._row_to_payroll(res)
        return await anyio.to_thread.run_sync(_get)

    async def get_all(
        self, tenant_id: str, filters: Optional[dict[str, Any]] = None,
        skip: int = 0, limit: int = 100,
    ) -> list[Payroll]:
        def _get_all():
            with get_db() as db:
                query_str = """
                    SELECT * FROM hrms_payroll 
                    WHERE workspace_id = :workspace_id AND deleted_at IS NULL
                """
                params = {"workspace_id": tenant_id}
                if filters:
                    if "employeeId" in filters:
                        query_str += " AND employee_id = :employeeId"
                        params["employeeId"] = filters["employeeId"]
                    if "month" in filters:
                        query_str += " AND month = :month"
                        params["month"] = filters["month"]
                    if "status" in filters:
                        query_str += " AND status = :status"
                        params["status"] = filters["status"]

                query_str += " ORDER BY month DESC, created_at DESC LIMIT :limit OFFSET :skip"
                params["limit"] = limit
                params["skip"] = skip

                res = db.execute(text(query_str), params).mappings().all()
                return [self._row_to_payroll(r) for r in res]
        return await anyio.to_thread.run_sync(_get_all)

    async def create(self, entity: Payroll) -> Payroll:
        def _create():
            with get_db() as db:
                sql = text("""
                    INSERT INTO hrms_payroll (
                        payroll_id, workspace_id, employee_id, employee_name, department, designation,
                        month, basic, hra, allowances, incentives, bonus, pf, esi, tds,
                        loan_deductions, gross_pay, total_deductions, net_pay, status,
                        created_at, updated_at
                    ) VALUES (
                        :payroll_id, :workspace_id, :employee_id, :employee_name, :department, :designation,
                        :month, :basic, :hra, :allowances, :incentives, :bonus, :pf, :esi, :tds,
                        :loan_deductions, :gross_pay, :total_deductions, :net_pay, :status,
                        :created_at, :updated_at
                    )
                """)
                db.execute(sql, {
                    "payroll_id": entity.payroll_id,
                    "workspace_id": entity.workspace_id,
                    "employee_id": entity.employee_id,
                    "employee_name": entity.employee_name,
                    "department": entity.department,
                    "designation": entity.designation,
                    "month": entity.month,
                    "basic": entity.basic,
                    "hra": entity.hra,
                    "allowances": entity.allowances,
                    "incentives": entity.incentives,
                    "bonus": entity.bonus,
                    "pf": entity.pf,
                    "esi": entity.esi,
                    "tds": entity.tds,
                    "loan_deductions": entity.loan_deductions,
                    "gross_pay": entity.gross_pay,
                    "total_deductions": entity.total_deductions,
                    "net_pay": entity.net_pay,
                    "status": entity.status,
                    "created_at": entity.created_at,
                    "updated_at": entity.updated_at,
                })
                db.commit()
                return entity
        return await anyio.to_thread.run_sync(_create)

    async def update(self, entity_id: str, tenant_id: str, data: dict[str, Any]) -> Optional[Payroll]:
        def _update():
            with get_db() as db:
                set_clauses = []
                params = {"payroll_id": entity_id, "workspace_id": tenant_id}

                field_map = {
                    "status": "status",
                    "basic": "basic",
                    "hra": "hra",
                    "allowances": "allowances",
                    "incentives": "incentives",
                    "bonus": "bonus",
                    "pf": "pf",
                    "esi": "esi",
                    "tds": "tds",
                    "loanDeductions": "loan_deductions",
                    "grossPay": "gross_pay",
                    "totalDeductions": "total_deductions",
                    "netPay": "net_pay",
                }

                for key, val in data.items():
                    db_col = field_map.get(key, key)
                    if db_col in field_map.values():
                        set_clauses.append(f"{db_col} = :{db_col}")
                        params[db_col] = val

                if not set_clauses:
                    return None

                set_clauses.append("updated_at = :updated_at")
                params["updated_at"] = datetime.now(timezone.utc)

                sql = text(f"""
                    UPDATE hrms_payroll 
                    SET {", ".join(set_clauses)}
                    WHERE payroll_id = :payroll_id AND workspace_id = :workspace_id AND deleted_at IS NULL
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
                    UPDATE hrms_payroll 
                    SET deleted_at = :deleted_at 
                    WHERE payroll_id = :payroll_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {
                    "payroll_id": entity_id,
                    "workspace_id": tenant_id,
                    "deleted_at": datetime.now(timezone.utc),
                })
                db.commit()
                return res.rowcount > 0
        return await anyio.to_thread.run_sync(_delete)

    async def count(self, tenant_id: str, filters: Optional[dict[str, Any]] = None) -> int:
        def _count():
            with get_db() as db:
                query_str = "SELECT COUNT(*) FROM hrms_payroll WHERE workspace_id = :workspace_id AND deleted_at IS NULL"
                params = {"workspace_id": tenant_id}
                if filters:
                    if "employeeId" in filters:
                        query_str += " AND employee_id = :employeeId"
                        params["employeeId"] = filters["employeeId"]
                res = db.execute(text(query_str), params).scalar()
                return res or 0
        return await anyio.to_thread.run_sync(_count)


_payroll_repo = PayrollRepository()

def get_payroll_repository() -> PayrollRepository:
    return _payroll_repo
