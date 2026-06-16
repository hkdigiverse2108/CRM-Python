from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional, List
import uuid


@dataclass
class RolePermission:
    """Module specific actions and scope permissions."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    role_id: str = ""
    module: str = ""
    can_view: bool = False
    can_create: bool = False
    can_edit: bool = False
    can_delete: bool = False
    can_export: bool = False
    can_import: bool = False
    can_approve: bool = False
    can_assign: bool = False
    can_archive: bool = False
    record_scope: str = "all"  # 'own', 'team', 'department', 'all'

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "roleId": self.role_id,
            "module": self.module,
            "canView": self.can_view,
            "canCreate": self.can_create,
            "canEdit": self.can_edit,
            "canDelete": self.can_delete,
            "canExport": self.can_export,
            "canImport": self.can_import,
            "canApprove": self.can_approve,
            "canAssign": self.can_assign,
            "canArchive": self.can_archive,
            "recordScope": self.record_scope
        }


@dataclass
class Role:
    """Role configuration containing a list of permissions."""
    role_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    workspace_id: str = ""
    role_name: str = ""
    description: Optional[str] = None
    is_custom: bool = True
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    role_color: str = "#6366f1"
    status: str = "active"
    created_by: Optional[str] = None
    pages_permissions: Optional[str] = None
    buttons_permissions: Optional[str] = None
    department_access: Optional[str] = None
    branch_access: Optional[str] = None
    permissions: List[RolePermission] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "id": self.role_id,
            "tenantId": self.workspace_id,
            "name": self.role_name,
            "description": self.description,
            "isCustom": self.is_custom,
            "createdAt": self.created_at.isoformat() if self.created_at else "",
            "roleColor": self.role_color,
            "status": self.status,
            "createdBy": self.created_by,
            "pagesPermissions": self.pages_permissions,
            "buttonsPermissions": self.buttons_permissions,
            "departmentAccess": self.department_access,
            "branchAccess": self.branch_access,
            "permissions": [p.to_dict() for p in self.permissions]
        }
