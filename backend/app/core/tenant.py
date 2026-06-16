"""
Tenant Registry Module
=======================
In-memory tenant registry for multi-tenant SaaS architecture.
Validates tenant IDs and provides tenant metadata.
Ready for future database-backed tenant storage.
"""

from dataclasses import dataclass, field
from typing import Optional

from backend.app.core.config import get_settings


@dataclass
class TenantConfig:
    """Configuration and metadata for a single tenant."""
    tenant_id: str
    name: str
    is_active: bool = True
    plan: str = "professional"
    max_users: int = 50
    features: list[str] = field(default_factory=lambda: [
        "crm", "finance", "hrms", "ecommerce", "omnichannel", "tasks"
    ])

    @property
    def id(self) -> str:
        """Alias for tenant_id to support request.state.tenant.id."""
        return self.tenant_id


class TenantRegistry:
    """
    In-memory registry of valid tenants.
    
    In production, this would be backed by a database lookup.
    Currently uses a static dict for development/demo purposes.
    """

    def __init__(self) -> None:
        # TODO: Replace with database-backed tenant lookup
        self._tenants: dict[str, TenantConfig] = {
            "rapidmodel_corp": TenantConfig(
                tenant_id="rapidmodel_corp",
                name="RapidModel Corp",
                plan="enterprise",
                max_users=200,
            ),
        }

    def validate_tenant(self, tenant_id: str) -> bool:
        """Check if a tenant ID exists and is active."""
        tenant = self.get_tenant_config(tenant_id)
        return tenant is not None and tenant.is_active

    def get_tenant_config(self, tenant_id: str) -> Optional[TenantConfig]:
        """Retrieve full tenant configuration by ID."""
        tenant = self._tenants.get(tenant_id)
        if tenant is None:
            from backend.app.core.database import get_db
            from sqlalchemy import text
            try:
                with get_db() as db:
                    result = db.execute(
                        text("SELECT workspace_id, workspace_name, plan_status, is_locked FROM workspaces WHERE workspace_id = :tid AND deleted_at IS NULL"),
                        {"tid": tenant_id}
                    ).fetchone()
                    if result:
                        w_id, w_name, plan_status, is_locked = result
                        is_active = (plan_status == "active" and not is_locked)
                        tenant = TenantConfig(
                            tenant_id=w_id,
                            name=w_name,
                            is_active=is_active,
                            plan=plan_status or "professional"
                        )
                        self._tenants[w_id] = tenant
            except Exception:
                pass
        return tenant

    def list_tenants(self) -> list[TenantConfig]:
        """Return all registered tenants."""
        # Query all active from DB to merge with memory list
        from backend.app.core.database import get_db
        from sqlalchemy import text
        try:
            with get_db() as db:
                results = db.execute(
                    text("SELECT workspace_id, workspace_name, plan_status, is_locked FROM workspaces WHERE deleted_at IS NULL")
                ).fetchall()
                for w_id, w_name, plan_status, is_locked in results:
                    if w_id not in self._tenants:
                        is_active = (plan_status == "active" and not is_locked)
                        self._tenants[w_id] = TenantConfig(
                            tenant_id=w_id,
                            name=w_name,
                            is_active=is_active,
                            plan=plan_status or "professional"
                        )
        except Exception:
            pass
        return list(self._tenants.values())



# Singleton instance
_registry = TenantRegistry()


def get_tenant_registry() -> TenantRegistry:
    """Return the singleton TenantRegistry instance."""
    return _registry
