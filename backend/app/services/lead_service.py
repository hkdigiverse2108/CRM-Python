"""
Lead Service
==============
Business logic for lead CRUD operations.
"""

from typing import Any, Optional

from backend.app.models.lead import Lead
from backend.app.repositories.lead_repo import LeadRepository, get_lead_repository
from backend.app.utils.exceptions import NotFoundException


class LeadService:
    """Lead management business logic."""

    def __init__(self, lead_repo: LeadRepository | None = None) -> None:
        self._repo = lead_repo or get_lead_repository()

    async def get_lead(self, lead_id: str, tenant_id: str) -> dict:
        lead = await self._repo.get_by_id(lead_id, tenant_id)
        if lead is None:
            raise NotFoundException(f"Lead '{lead_id}' not found")
        return lead.to_dict()

    async def list_leads(
        self, tenant_id: str, filters: Optional[dict[str, Any]] = None,
        page: int = 1, per_page: int = 20,
    ) -> dict:
        skip = (page - 1) * per_page
        leads = await self._repo.get_all(tenant_id, filters, skip=skip, limit=per_page)
        total = await self._repo.count(tenant_id, filters)
        return {
            "items": [l.to_dict() for l in leads],
            "meta": {
                "page": page, "per_page": per_page,
                "total": total, "total_pages": (total + per_page - 1) // per_page,
            },
        }

    async def create_lead(self, data: dict[str, Any], tenant_id: str, created_by: Optional[str] = "Admin") -> dict:
        lead = Lead(
            name=data["name"], email=data["email"],
            phone=data.get("phone"), company=data.get("company"),
            source=data.get("source", "website"),
            value=data.get("value", 0.0), notes=data.get("notes"),
            created_by=created_by,
            tenant_id=tenant_id,
        )
        created = await self._repo.create(lead)
        return created.to_dict()

    async def update_lead(self, lead_id: str, tenant_id: str, data: dict[str, Any], changed_by: Optional[str] = None) -> dict:
        updated = await self._repo.update(lead_id, tenant_id, data, changed_by)
        if updated is None:
            raise NotFoundException(f"Lead '{lead_id}' not found")

    async def get_lead_audit_logs(self, lead_id: str, tenant_id: str) -> list[dict]:
        return await self._repo.get_audit_logs(lead_id, tenant_id)
            
        # If lead is assigned, ensure corresponding client and project exist
        if "assigned_to" in data and data["assigned_to"]:
            from backend.app.core.database import get_db
            from sqlalchemy import text
            import uuid
            
            assignee_value = data["assigned_to"]
            with get_db() as db:
                # Fetch lead details
                lead = db.execute(
                    text("SELECT full_name, phone_primary, email, company_name FROM leads WHERE lead_id = :lead_id AND workspace_id = :ws_id LIMIT 1"),
                    {"lead_id": lead_id, "ws_id": tenant_id}
                ).mappings().first()
                
                if lead:
                    lead_name = lead["full_name"]
                    lead_phone = lead["phone_primary"] or ""
                    lead_email = lead["email"] or ""
                    
                    # Determine agent name
                    agent_name = assignee_value
                    db_agent_name = db.execute(
                        text("SELECT full_name FROM users WHERE user_id = :uid AND workspace_id = :ws_id LIMIT 1"),
                        {"uid": assignee_value, "ws_id": tenant_id}
                    ).scalar()
                    if db_agent_name:
                        agent_name = db_agent_name
                        
                    # 1. Check/Insert Client
                    client_id = None
                    if lead_phone:
                        client_id = db.execute(
                            text("SELECT client_id FROM clients WHERE workspace_id = :ws_id AND phone = :phone LIMIT 1"),
                            {"ws_id": tenant_id, "phone": lead_phone}
                        ).scalar()
                        
                    if not client_id:
                        client_id = str(uuid.uuid4())
                        db.execute(
                            text("""
                                INSERT INTO clients (client_id, workspace_id, name, email, phone, status, created_at, updated_at)
                                VALUES (:client_id, :ws_id, :name, :email, :phone, 'Active', NOW(), NOW())
                            """),
                            {
                                "client_id": client_id,
                                "ws_id": tenant_id,
                                "name": lead_name,
                                "email": lead_email,
                                "phone": lead_phone
                            }
                        )
                        
                    # 2. Check/Insert Project
                    proj_exists = db.execute(
                        text("SELECT project_id FROM projects WHERE workspace_id = :ws_id AND client_id = :client_id LIMIT 1"),
                        {"ws_id": tenant_id, "client_id": client_id}
                    ).scalar()
                    
                    if not proj_exists:
                        project_id = str(uuid.uuid4())
                        db.execute(
                            text("""
                                INSERT INTO projects (project_id, workspace_id, name, description, client_id, client_name, assigned_manager, status, stage, created_at, updated_at)
                                VALUES (:proj_id, :ws_id, :name, :desc, :client_id, :client_name, :manager, 'Active', 'New Project', NOW(), NOW())
                            """),
                            {
                                "proj_id": project_id,
                                "ws_id": tenant_id,
                                "name": f"Project for {lead_name}",
                                "desc": f"Automated project generated from lead assignment for {lead_name}.",
                                "client_id": client_id,
                                "client_name": lead_name,
                                "manager": agent_name
                            }
                        )
                        db.commit()
                        
        return updated.to_dict()

    async def delete_lead(self, lead_id: str, tenant_id: str) -> bool:
        deleted = await self._repo.delete(lead_id, tenant_id)
        if not deleted:
            raise NotFoundException(f"Lead '{lead_id}' not found")
        return True


_lead_service = LeadService()

def get_lead_service() -> LeadService:
    return _lead_service
