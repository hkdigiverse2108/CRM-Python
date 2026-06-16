"""
Project Domain Model
====================
Represents a project in the CRM.
"""

from dataclasses import dataclass, field
from datetime import datetime, date, timezone
from typing import Optional, List, Any
import uuid


@dataclass
class Project:
    """CRM project entity."""

    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str = ""
    name: str = ""
    description: Optional[str] = None
    client_id: Optional[str] = None
    client_name: Optional[str] = None
    category: str = "Web Development"
    type: str = "Client Project"
    priority: str = "Medium"
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    estimated_completion: Optional[date] = None
    budget: float = 0.0
    project_value: float = 0.0
    department: str = "Engineering"
    assigned_manager: Optional[str] = None
    assigned_team: list = field(default_factory=list)
    status: str = "Active"
    stage: str = "New Project"
    tags: list = field(default_factory=list)
    notes: Optional[str] = None
    created_by: str = "CRM Admin"
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "tenantId": self.tenant_id,
            "name": self.name,
            "description": self.description,
            "clientId": self.client_id,
            "clientName": self.client_name,
            "category": self.category,
            "type": self.type,
            "priority": self.priority,
            "startDate": self.start_date.isoformat() if self.start_date else "",
            "endDate": self.end_date.isoformat() if self.end_date else "",
            "estimatedCompletion": self.estimated_completion.isoformat() if self.estimated_completion else "",
            "budget": self.budget,
            "projectValue": self.project_value,
            "department": self.department,
            "assignedManager": self.assigned_manager,
            "assignedTeam": self.assigned_team,
            "status": self.status,
            "stage": self.stage,
            "tags": self.tags,
            "notes": self.notes,
            "createdBy": self.created_by,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat(),
        }

