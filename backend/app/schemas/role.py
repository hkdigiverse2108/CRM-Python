from typing import Optional, List
from pydantic import BaseModel, Field


class RolePermissionSchema(BaseModel):
    module: str
    canView: bool = False
    canCreate: bool = False
    canEdit: bool = False
    canDelete: bool = False
    canExport: bool = False
    canImport: bool = False
    canApprove: bool = False
    canAssign: bool = False
    canArchive: bool = False
    recordScope: str = "all"


class RoleCreate(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    permissions: List[RolePermissionSchema] = []
    roleColor: Optional[str] = "#6366f1"
    status: Optional[str] = "active"
    pagesPermissions: Optional[str] = None
    buttonsPermissions: Optional[str] = None
    departmentAccess: Optional[str] = None
    branchAccess: Optional[str] = None


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[List[RolePermissionSchema]] = None
    roleColor: Optional[str] = None
    status: Optional[str] = None
    pagesPermissions: Optional[str] = None
    buttonsPermissions: Optional[str] = None
    departmentAccess: Optional[str] = None
    branchAccess: Optional[str] = None
