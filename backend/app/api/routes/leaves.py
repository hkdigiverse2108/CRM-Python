from fastapi import APIRouter, Depends, Query, Request

from backend.app.schemas.leave import LeaveCreate, LeaveUpdate
from backend.app.services.leave_service import LeaveService, get_leave_service
from backend.app.api.dependencies.auth import get_current_user
from backend.app.utils.response import success_response

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("")
async def list_leaves(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(100, ge=1, le=500),
    employeeId: str | None = None,
    status: str | None = None,
    leave_service: LeaveService = Depends(get_leave_service),
):
    tenant_id = request.state.tenant.id
    filters = {}
    if employeeId:
        filters["employeeId"] = employeeId
    if status:
        filters["status"] = status

    result = await leave_service.list_leaves(
        tenant_id=tenant_id,
        filters=filters,
        page=page,
        per_page=per_page,
    )
    return success_response(
        data=result["items"],
        message="Leave requests listed successfully",
        meta=result["meta"],
    )


@router.post("")
async def create_leave_request(
    request: Request,
    payload: LeaveCreate,
    leave_service: LeaveService = Depends(get_leave_service),
):
    tenant_id = request.state.tenant.id
    res = await leave_service.create_leave_request(data=payload.model_dump(), tenant_id=tenant_id)
    return success_response(data=res, message="Leave request submitted successfully", status_code=201)


@router.put("/{leave_id}")
async def update_leave_status(
    request: Request,
    leave_id: str,
    payload: LeaveUpdate,
    leave_service: LeaveService = Depends(get_leave_service),
):
    tenant_id = request.state.tenant.id
    updated = await leave_service.update_leave_status(
        leave_id=leave_id,
        tenant_id=tenant_id,
        data=payload.model_dump(exclude_unset=True),
    )
    return success_response(data=updated, message="Leave request updated successfully")


@router.delete("/{leave_id}")
async def delete_leave(
    request: Request,
    leave_id: str,
    leave_service: LeaveService = Depends(get_leave_service),
):
    tenant_id = request.state.tenant.id
    await leave_service.delete_leave(leave_id=leave_id, tenant_id=tenant_id)
    return success_response(message="Leave request deleted successfully")


import os
import shutil
import uuid
from fastapi import UploadFile, File, HTTPException

@router.post("/upload")
async def upload_leave_proof(
    request: Request,
    file: UploadFile = File(...),
):
    # Enforce maximum size of 200MB (200 * 1024 * 1024 bytes)
    MAX_SIZE = 200 * 1024 * 1024
    
    # Fast size check via tell()
    file.file.seek(0, os.SEEK_END)
    size = file.file.tell()
    file.file.seek(0)
    
    if size > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds the 200MB limit.")
        
    tenant_id = request.state.tenant.id
    
    # Check database for workspace-specific Cloudinary settings
    from backend.app.core.database import get_db
    from sqlalchemy import text
    
    with get_db() as db:
        workspace = db.execute(
            text("""
                SELECT cloudinary_cloud_name, cloudinary_api_key, cloudinary_api_secret 
                FROM workspaces 
                WHERE workspace_id = :tenant_id 
                LIMIT 1
            """),
            {"tenant_id": tenant_id}
        ).mappings().first()
        
    cloud_name = workspace.get("cloudinary_cloud_name") if workspace else None
    api_key = workspace.get("cloudinary_api_key") if workspace else None
    api_secret = workspace.get("cloudinary_api_secret") if workspace else None
    
    # Fallback to global environment variables
    if not (cloud_name and api_key and api_secret):
        cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
        api_key = os.getenv("CLOUDINARY_API_KEY")
        api_secret = os.getenv("CLOUDINARY_API_SECRET")
        
    # If Cloudinary credentials are provided, upload to Cloudinary
    if cloud_name and api_key and api_secret:
        try:
            import cloudinary
            import cloudinary.uploader
            cloudinary.config(
                cloud_name=cloud_name,
                api_key=api_key,
                api_secret=api_secret,
                secure=True
            )
            file.file.seek(0)
            file_bytes = await file.read()
            upload_result = cloudinary.uploader.upload(
                file_bytes,
                resource_type="auto",
                folder=f"crm_tenant_{tenant_id}"
            )
            full_url = upload_result.get("secure_url")
            return success_response(
                data={"url": full_url, "filename": file.filename},
                message="File uploaded to Cloudinary successfully",
            )
        except Exception as e:
            # Fall back silently to local storage
            pass

    os.makedirs("uploads", exist_ok=True)
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join("uploads", unique_filename)
    
    file.file.seek(0)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return success_response(
        data={"url": f"/uploads/{unique_filename}", "filename": file.filename},
        message="File uploaded locally successfully",
    )
