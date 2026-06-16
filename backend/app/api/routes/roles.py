from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Query
import uuid
import anyio
from pydantic import BaseModel
from sqlalchemy import text

from backend.app.schemas.role import RoleCreate, RoleUpdate
from backend.app.repositories.role_repo import RoleRepository, get_role_repository
from backend.app.models.role import Role, RolePermission
from backend.app.api.dependencies.auth import get_current_user
from backend.app.services.audit_log_service import AuditLogService, get_audit_log_service
from backend.app.utils.response import success_response
from backend.app.core.database import get_db

router = APIRouter(dependencies=[Depends(get_current_user)])


class RoleDuplicatePayload(BaseModel):
    name: str


@router.get("")
async def list_roles(
    request: Request,
    is_custom: Optional[bool] = Query(None),
    role_repo: RoleRepository = Depends(get_role_repository)
):
    tenant_id = request.state.user["tenant_id"]
    filters = {}
    if is_custom is not None:
        filters["is_custom"] = is_custom

    roles = await role_repo.get_all(tenant_id=tenant_id, filters=filters)
    return success_response(
        data=[r.to_dict() for r in roles],
        message="Roles listed successfully"
    )


@router.post("")
async def create_role(
    request: Request,
    payload: RoleCreate,
    role_repo: RoleRepository = Depends(get_role_repository),
    audit_service: AuditLogService = Depends(get_audit_log_service)
):
    user = request.state.user
    tenant_id = user["tenant_id"]
    
    # Check if role name already exists
    existing_roles = await role_repo.get_all(tenant_id)
    if any(r.role_name.lower() == payload.name.lower() for r in existing_roles):
        raise HTTPException(status_code=400, detail=f"Role with name '{payload.name}' already exists.")

    role_id = f"role_{uuid.uuid4().hex[:12]}_{tenant_id}"
    
    perms = []
    for p in payload.permissions:
        perms.append(RolePermission(
            id=str(uuid.uuid4()),
            role_id=role_id,
            module=p.module,
            can_view=p.canView,
            can_create=p.canCreate,
            can_edit=p.canEdit,
            can_delete=p.canDelete,
            can_export=p.canExport,
            can_import=p.canImport,
            can_approve=p.canApprove,
            can_assign=p.canAssign,
            can_archive=p.canArchive,
            record_scope=p.recordScope
        ))

    role = Role(
        role_id=role_id,
        workspace_id=tenant_id,
        role_name=payload.name,
        description=payload.description,
        is_custom=True,
        role_color=payload.roleColor or "#6366f1",
        status=payload.status or "active",
        created_by=user["email"],
        pages_permissions=payload.pagesPermissions,
        buttons_permissions=payload.buttonsPermissions,
        department_access=payload.departmentAccess,
        branch_access=payload.branchAccess,
        permissions=perms
    )

    created_role = await role_repo.create(role)

    # Log to Audit Logs
    await audit_service.log_action(
        workspace_id=tenant_id,
        user_id=user["id"],
        user_email=user["email"],
        action="ROLE_CREATE",
        module="users",
        record_id=role_id,
        details=f"Created custom role '{payload.name}' with {len(perms)} module permission rules."
    )

    return success_response(data=created_role.to_dict(), message="Role created successfully", status_code=201)


@router.put("/{role_id}")
async def update_role(
    request: Request,
    role_id: str,
    payload: RoleUpdate,
    role_repo: RoleRepository = Depends(get_role_repository),
    audit_service: AuditLogService = Depends(get_audit_log_service)
):
    user = request.state.user
    tenant_id = user["tenant_id"]

    role = await role_repo.get_by_id(role_id, tenant_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found.")
    
    if not role.is_custom:
        raise HTTPException(status_code=403, detail="Standard system roles cannot be modified.")

    update_data = {}
    if payload.name is not None:
        update_data["name"] = payload.name
    if payload.description is not None:
        update_data["description"] = payload.description
    # Ensure modules with allowed pages have view permission enabled
    pages_list = []
    pages_src = payload.pagesPermissions if payload.pagesPermissions is not None else role.pages_permissions
    if pages_src:
        import json
        try:
            pages_list = json.loads(pages_src) if isinstance(pages_src, str) else pages_src
        except:
            pages_list = []

    if payload.permissions is not None:
        permissions_dict = {p.module: p.model_dump() for p in payload.permissions}
        for pk in pages_list:
            mod = "dashboard" if pk == "crm_dashboard" else (pk.split("_")[0] if "_" in pk else None)
            if mod:
                if mod in permissions_dict:
                    permissions_dict[mod]["canView"] = True
                else:
                    permissions_dict[mod] = {
                        "module": mod,
                        "canView": True,
                        "canCreate": False,
                        "canEdit": False,
                        "canDelete": False,
                        "canExport": False,
                        "canImport": False,
                        "canApprove": False,
                        "canAssign": False,
                        "canArchive": False,
                        "recordScope": "all"
                    }
        update_data["permissions"] = list(permissions_dict.values())

    if payload.roleColor is not None:
        update_data["roleColor"] = payload.roleColor
    if payload.status is not None:
        update_data["status"] = payload.status
    if payload.pagesPermissions is not None:
        update_data["pagesPermissions"] = payload.pagesPermissions
    if payload.buttonsPermissions is not None:
        update_data["buttonsPermissions"] = payload.buttonsPermissions
    if payload.departmentAccess is not None:
        update_data["departmentAccess"] = payload.departmentAccess
    if payload.branchAccess is not None:
        update_data["branchAccess"] = payload.branchAccess

    updated_role = await role_repo.update(role_id, tenant_id, update_data)

    # Log to Audit Logs
    await audit_service.log_action(
        workspace_id=tenant_id,
        user_id=user["id"],
        user_email=user["email"],
        action="ROLE_UPDATE",
        module="users",
        record_id=role_id,
        details=f"Updated permissions or properties of custom role '{role.role_name}'."
    )

    return success_response(data=updated_role.to_dict(), message="Role updated successfully")


@router.delete("/{role_id}")
async def delete_role(
    request: Request,
    role_id: str,
    role_repo: RoleRepository = Depends(get_role_repository),
    audit_service: AuditLogService = Depends(get_audit_log_service)
):
    user = request.state.user
    tenant_id = user["tenant_id"]

    role = await role_repo.get_by_id(role_id, tenant_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found.")
    
    if not role.is_custom:
        raise HTTPException(status_code=403, detail="Standard system roles cannot be deleted.")

    # Check if user assignment exists
    def get_assigned_count():
        with get_db() as db:
            return db.execute(
                text("SELECT COUNT(*) FROM users WHERE role_id = :role_id AND deleted_at IS NULL"),
                {"role_id": role_id}
            ).scalar() or 0

    assigned_count = await anyio.to_thread.run_sync(get_assigned_count)
    if assigned_count > 0:
        raise HTTPException(
            status_code=400,
            detail="This role is assigned to employees. Please transfer users to another role before deleting."
        )

    success = await role_repo.delete(role_id, tenant_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete role.")

    # Log to Audit Logs
    await audit_service.log_action(
        workspace_id=tenant_id,
        user_id=user["id"],
        user_email=user["email"],
        action="ROLE_DELETE",
        module="users",
        record_id=role_id,
        details=f"Deleted custom role '{role.role_name}'."
    )

    return success_response(message="Role deleted successfully")


@router.post("/{role_id}/duplicate")
async def duplicate_role(
    request: Request,
    role_id: str,
    payload: RoleDuplicatePayload,
    role_repo: RoleRepository = Depends(get_role_repository),
    audit_service: AuditLogService = Depends(get_audit_log_service)
):
    user = request.state.user
    tenant_id = user["tenant_id"]

    src_role = await role_repo.get_by_id(role_id, tenant_id)
    if not src_role:
        raise HTTPException(status_code=404, detail="Source role not found.")

    # Check if role name already exists
    existing_roles = await role_repo.get_all(tenant_id)
    if any(r.role_name.lower() == payload.name.lower() for r in existing_roles):
        raise HTTPException(status_code=400, detail=f"Role with name '{payload.name}' already exists.")

    new_role_id = f"role_{uuid.uuid4().hex[:12]}_{tenant_id}"

    perms = []
    for p in src_role.permissions:
        perms.append(RolePermission(
            id=str(uuid.uuid4()),
            role_id=new_role_id,
            module=p.module,
            can_view=p.can_view,
            can_create=p.can_create,
            can_edit=p.can_edit,
            can_delete=p.can_delete,
            can_export=p.can_export,
            can_import=p.can_import,
            can_approve=p.can_approve,
            can_assign=p.can_assign,
            can_archive=p.can_archive,
            record_scope=p.record_scope
        ))

    new_role = Role(
        role_id=new_role_id,
        workspace_id=tenant_id,
        role_name=payload.name,
        description=f"Cloned from {src_role.role_name}. " + (src_role.description or ""),
        is_custom=True,
        role_color=src_role.role_color,
        status="active",
        created_by=user["email"],
        pages_permissions=src_role.pages_permissions,
        buttons_permissions=src_role.buttons_permissions,
        department_access=src_role.department_access,
        branch_access=src_role.branch_access,
        permissions=perms
    )

    created_role = await role_repo.create(new_role)

    # Log to Audit Logs
    await audit_service.log_action(
        workspace_id=tenant_id,
        user_id=user["id"],
        user_email=user["email"],
        action="ROLE_CREATE",
        module="users",
        record_id=new_role_id,
        details=f"Duplicated role '{src_role.role_name}' to '{payload.name}'."
    )

    return success_response(data=created_role.to_dict(), message="Role duplicated successfully", status_code=201)
