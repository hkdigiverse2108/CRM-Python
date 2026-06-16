import uuid
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import text

from backend.app.schemas.payroll_adjustment import PayrollAdjustmentCreate
from backend.app.api.dependencies.auth import get_current_user
from backend.app.core.database import get_db
from backend.app.utils.response import success_response

router = APIRouter(dependencies=[Depends(get_current_user)])

@router.get("")
async def list_adjustments(
    request: Request,
    employeeId: str | None = None,
    type: str | None = None,
):
    tenant_id = request.state.tenant.id
    
    with get_db() as db:
        query = "SELECT * FROM hrms_payroll_adjustments WHERE workspace_id = :workspace_id"
        params = {"workspace_id": tenant_id}
        
        if employeeId:
            query += " AND employee_id = :employee_id"
            params["employee_id"] = employeeId
        if type and type != "All":
            query += " AND type = :type"
            params["type"] = type
            
        query += " ORDER BY date DESC, created_at DESC"
        res = db.execute(text(query), params).mappings().all()
        
        items = []
        for row in res:
            items.append({
                "id": row["adjustment_id"],
                "employeeId": row["employee_id"],
                "employeeName": row["employee_name"],
                "type": row["type"],
                "amount": float(row["amount"]),
                "date": row["date"].isoformat() if row["date"] else "",
                "reason": row["reason"],
            })
            
    return success_response(data=items, message="Payroll adjustments listed successfully")

@router.post("")
async def create_adjustment(
    request: Request,
    payload: PayrollAdjustmentCreate,
):
    tenant_id = request.state.tenant.id
    adj_id = str(uuid.uuid4())
    
    with get_db() as db:
        sql = text("""
            INSERT INTO hrms_payroll_adjustments (
                adjustment_id, workspace_id, employee_id, employee_name, type, amount, date, reason
            ) VALUES (
                :adjustment_id, :workspace_id, :employee_id, :employee_name, :type, :amount, :date, :reason
            )
        """)
        db.execute(sql, {
            "adjustment_id": adj_id,
            "workspace_id": tenant_id,
            "employee_id": payload.employeeId,
            "employee_name": payload.employeeName,
            "type": payload.type,
            "amount": payload.amount,
            "date": payload.date,
            "reason": payload.reason,
        })
        db.commit()
        
    return success_response(
        data={
            "id": adj_id,
            "employeeId": payload.employeeId,
            "employeeName": payload.employeeName,
            "type": payload.type,
            "amount": payload.amount,
            "date": payload.date.isoformat(),
            "reason": payload.reason,
        },
        message="Payroll adjustment created successfully",
        status_code=201
    )

@router.delete("/{adjustment_id}")
async def delete_adjustment(
    request: Request,
    adjustment_id: str,
):
    tenant_id = request.state.tenant.id
    
    with get_db() as db:
        sql = text("""
            DELETE FROM hrms_payroll_adjustments 
            WHERE adjustment_id = :adjustment_id AND workspace_id = :workspace_id
        """)
        db.execute(sql, {"adjustment_id": adjustment_id, "workspace_id": tenant_id})
        db.commit()
        
    return success_response(message="Payroll adjustment deleted successfully")
