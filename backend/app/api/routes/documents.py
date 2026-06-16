import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy import text
from typing import Optional

from backend.app.schemas.document import LetterRequestCreate, LetterRequestUpdate, DocumentUploadCreate
from backend.app.api.dependencies.auth import get_current_user, PermissionChecker
from backend.app.utils.response import success_response
from backend.app.core.database import get_db

router = APIRouter(dependencies=[Depends(get_current_user)])

@router.get("/submissions", dependencies=[Depends(PermissionChecker("hrms", "view"))])
async def list_submissions(
    request: Request,
    employee_id: Optional[str] = None
):
    tenant_id = request.state.tenant.id
    
    def _fetch():
        with get_db() as db:
            if employee_id:
                sql = text("""
                    SELECT employee_id, name, documents 
                    FROM hrms_employees 
                    WHERE employee_id = :employee_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {"employee_id": employee_id, "workspace_id": tenant_id}).mappings().all()
            else:
                sql = text("""
                    SELECT employee_id, name, documents 
                    FROM hrms_employees 
                    WHERE workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {"workspace_id": tenant_id}).mappings().all()
            
            flat_docs = []
            import json
            for r in res:
                docs = []
                if r["documents"]:
                    try:
                        docs = json.loads(r["documents"]) if isinstance(r["documents"], str) else r["documents"]
                    except:
                        docs = []
                for d in docs:
                    flat_docs.append({
                        "employeeId": r["employee_id"],
                        "employeeName": r["name"],
                        "name": d.get("name"),
                        "type": d.get("type"),
                        "uploadDate": d.get("uploadDate") or d.get("date") or ""
                    })
            return flat_docs

    import anyio
    data = await anyio.to_thread.run_sync(_fetch)
    return success_response(data=data, message="Submitted documents listed successfully")

@router.post("/submissions", dependencies=[Depends(PermissionChecker("hrms", "create"))])
async def upload_document(
    request: Request,
    payload: DocumentUploadCreate
):
    tenant_id = request.state.tenant.id
    
    def _upload():
        with get_db() as db:
            # Check employee
            check_sql = text("SELECT documents FROM hrms_employees WHERE employee_id = :emp_id AND workspace_id = :workspace_id AND deleted_at IS NULL")
            emp = db.execute(check_sql, {"emp_id": payload.employeeId, "workspace_id": tenant_id}).mappings().first()
            if not emp:
                raise HTTPException(status_code=404, detail="Employee not found")
            
            import json
            existing_docs = []
            if emp["documents"]:
                try:
                    existing_docs = json.loads(emp["documents"]) if isinstance(emp["documents"], str) else emp["documents"]
                except:
                    existing_docs = []
            
            new_doc = {
                "name": payload.name,
                "type": payload.type,
                "uploadDate": date.today().isoformat()
            }
            existing_docs.append(new_doc)
            
            update_sql = text("""
                UPDATE hrms_employees 
                SET documents = :docs, updated_at = NOW() 
                WHERE employee_id = :emp_id AND workspace_id = :workspace_id AND deleted_at IS NULL
            """)
            db.execute(update_sql, {"docs": json.dumps(existing_docs), "emp_id": payload.employeeId, "workspace_id": tenant_id})
            db.commit()
            return new_doc

    import anyio
    try:
        new_doc = await anyio.to_thread.run_sync(_upload)
        return success_response(data=new_doc, message="Document uploaded successfully", status_code=201)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/letters", dependencies=[Depends(PermissionChecker("hrms", "view"))])
async def list_letter_requests(
    request: Request,
    employee_id: Optional[str] = None
):
    tenant_id = request.state.tenant.id
    
    def _fetch():
        with get_db() as db:
            query = "SELECT * FROM hrms_letter_requests WHERE workspace_id = :workspace_id AND deleted_at IS NULL"
            params = {"workspace_id": tenant_id}
            if employee_id:
                query += " AND employee_id = :employee_id"
                params["employee_id"] = employee_id
            query += " ORDER BY created_at DESC"
            res = db.execute(text(query), params).mappings().all()
            
            output = []
            for r in res:
                output.append({
                    "id": r["request_id"],
                    "employeeId": r["employee_id"],
                    "employeeName": r["employee_name"],
                    "letterType": r["letter_type"],
                    "reason": r["reason"],
                    "requestedDate": r["requested_date"].isoformat() if isinstance(r["requested_date"], (date, date.today().__class__)) else str(r["requested_date"]),
                    "status": r["status"],
                    "actionsTaken": r["actions_taken"]
                })
            return output

    import anyio
    data = await anyio.to_thread.run_sync(_fetch)
    return success_response(data=data, message="Letter requests listed successfully")

@router.post("/letters", dependencies=[Depends(PermissionChecker("hrms", "create"))])
async def create_letter_request(
    request: Request,
    payload: LetterRequestCreate
):
    tenant_id = request.state.tenant.id
    
    def _create():
        with get_db() as db:
            check_sql = text("SELECT name FROM hrms_employees WHERE employee_id = :emp_id AND workspace_id = :workspace_id AND deleted_at IS NULL")
            emp = db.execute(check_sql, {"emp_id": payload.employeeId, "workspace_id": tenant_id}).mappings().first()
            if not emp:
                raise HTTPException(status_code=404, detail="Employee not found")
            
            req_id = f"REQ-{uuid.uuid4().hex[:6].upper()}"
            today = date.today()
            
            insert_sql = text("""
                INSERT INTO hrms_letter_requests (
                    request_id, workspace_id, employee_id, employee_name, letter_type, reason, requested_date, status, actions_taken
                ) VALUES (
                    :req_id, :workspace_id, :employee_id, :employee_name, :letter_type, :reason, :requested_date, 'PENDING', 'Awaiting Admin Action'
                )
            """)
            db.execute(insert_sql, {
                "req_id": req_id,
                "workspace_id": tenant_id,
                "employee_id": payload.employeeId,
                "employee_name": emp["name"],
                "letter_type": payload.letterType,
                "reason": payload.reason,
                "requested_date": today
            })
            db.commit()
            
            return {
                "id": req_id,
                "employeeId": payload.employeeId,
                "employeeName": emp["name"],
                "letterType": payload.letterType,
                "reason": payload.reason,
                "requestedDate": today.isoformat(),
                "status": "PENDING",
                "actionsTaken": "Awaiting Admin Action"
            }

    import anyio
    try:
        new_req = await anyio.to_thread.run_sync(_create)
        return success_response(data=new_req, message="Letter request created successfully", status_code=201)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/letters/{request_id}", dependencies=[Depends(PermissionChecker("hrms", "edit"))])
async def update_letter_request(
    request: Request,
    request_id: str,
    payload: LetterRequestUpdate
):
    tenant_id = request.state.tenant.id
    
    def _update():
        with get_db() as db:
            check_sql = text("SELECT * FROM hrms_letter_requests WHERE request_id = :req_id AND workspace_id = :workspace_id AND deleted_at IS NULL")
            req = db.execute(check_sql, {"req_id": request_id, "workspace_id": tenant_id}).mappings().first()
            if not req:
                raise HTTPException(status_code=404, detail="Letter request not found")
            
            set_clauses = []
            params = {"req_id": request_id, "workspace_id": tenant_id}
            if payload.status is not None:
                set_clauses.append("status = :status")
                params["status"] = payload.status
            if payload.actionsTaken is not None:
                set_clauses.append("actions_taken = :actions_taken")
                params["actions_taken"] = payload.actionsTaken
            
            if not set_clauses:
                raise HTTPException(status_code=400, detail="Nothing to update")
            
            sql = text(f"UPDATE hrms_letter_requests SET {', '.join(set_clauses)}, updated_at = NOW() WHERE request_id = :req_id AND workspace_id = :workspace_id")
            db.execute(sql, params)
            db.commit()
            
            # Refetch
            refetch = db.execute(check_sql, {"req_id": request_id, "workspace_id": tenant_id}).mappings().first()
            return {
                "id": refetch["request_id"],
                "employeeId": refetch["employee_id"],
                "employeeName": refetch["employee_name"],
                "letterType": refetch["letter_type"],
                "reason": refetch["reason"],
                "requestedDate": refetch["requested_date"].isoformat() if isinstance(refetch["requested_date"], (date, date.today().__class__)) else str(refetch["requested_date"]),
                "status": refetch["status"],
                "actionsTaken": refetch["actions_taken"]
            }

    import anyio
    try:
        updated = await anyio.to_thread.run_sync(_update)
        return success_response(data=updated, message="Letter request updated successfully")
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
