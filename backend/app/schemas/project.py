"""
Project CRUD Schemas
====================
Request/response models for project management endpoints.
"""

from typing import Optional, List, Any
from datetime import date
from pydantic import BaseModel, Field, AliasChoices, model_validator


class ProjectCreate(BaseModel):
    """POST /projects"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    client_id: Optional[str] = Field(default=None, validation_alias=AliasChoices("clientId", "client_id"))
    client_name: Optional[str] = Field(default=None, validation_alias=AliasChoices("clientName", "client_name"))
    category: str = Field(default="Web Development", max_length=100)
    type: str = Field(default="Client Project", max_length=100)
    priority: str = Field(default="Medium", max_length=50)
    start_date: Optional[date] = Field(default=None, validation_alias=AliasChoices("startDate", "start_date"))
    end_date: Optional[date] = Field(default=None, validation_alias=AliasChoices("endDate", "end_date"))
    estimated_completion: Optional[date] = Field(default=None, validation_alias=AliasChoices("estimatedCompletion", "estimated_completion"))
    budget: float = Field(default=0.0, ge=0)
    project_value: float = Field(default=0.0, ge=0, validation_alias=AliasChoices("projectValue", "project_value"))
    department: str = Field(default="Engineering", max_length=100)
    assigned_manager: Optional[str] = Field(default=None, validation_alias=AliasChoices("assignedManager", "assigned_manager"))
    assigned_team: Optional[List[str]] = Field(default=None, validation_alias=AliasChoices("assignedTeam", "assigned_team"))
    status: str = Field(default="Active", max_length=50)
    stage: str = Field(default="New Project", max_length=100)
    tags: Optional[List[str]] = None
    notes: Optional[str] = None
    created_by: str = Field(default="CRM Admin", max_length=255, validation_alias=AliasChoices("createdBy", "created_by"))

    @model_validator(mode="before")
    @classmethod
    def clean_empty_strings(cls, data: Any) -> Any:
        if isinstance(data, dict):
            fields_to_clean = [
                "startDate", "start_date", "endDate", "end_date",
                "estimatedCompletion", "estimated_completion",
                "clientId", "client_id", "clientName", "client_name",
                "assignedManager", "assigned_manager"
            ]
            for f in fields_to_clean:
                if f in data and data[f] == "":
                    data[f] = None
        return data


class ProjectUpdate(BaseModel):
    """PUT /projects/{id}"""
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    client_id: Optional[str] = Field(default=None, validation_alias=AliasChoices("clientId", "client_id"))
    client_name: Optional[str] = Field(default=None, validation_alias=AliasChoices("clientName", "client_name"))
    category: Optional[str] = Field(default=None, max_length=100)
    type: Optional[str] = Field(default=None, max_length=100)
    priority: Optional[str] = Field(default=None, max_length=50)
    start_date: Optional[date] = Field(default=None, validation_alias=AliasChoices("startDate", "start_date"))
    end_date: Optional[date] = Field(default=None, validation_alias=AliasChoices("endDate", "end_date"))
    estimated_completion: Optional[date] = Field(default=None, validation_alias=AliasChoices("estimatedCompletion", "estimated_completion"))
    budget: Optional[float] = Field(default=None, ge=0)
    project_value: Optional[float] = Field(default=None, ge=0, validation_alias=AliasChoices("projectValue", "project_value"))
    department: Optional[str] = Field(default=None, max_length=100)
    assigned_manager: Optional[str] = Field(default=None, validation_alias=AliasChoices("assignedManager", "assigned_manager"))
    assigned_team: Optional[List[str]] = Field(default=None, validation_alias=AliasChoices("assignedTeam", "assigned_team"))
    status: Optional[str] = Field(default=None, max_length=50)
    stage: Optional[str] = Field(default=None, max_length=100)
    tags: Optional[List[str]] = None
    notes: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def clean_empty_strings(cls, data: Any) -> Any:
        if isinstance(data, dict):
            fields_to_clean = [
                "startDate", "start_date", "endDate", "end_date",
                "estimatedCompletion", "estimated_completion",
                "clientId", "client_id", "clientName", "client_name",
                "assignedManager", "assigned_manager"
            ]
            for f in fields_to_clean:
                if f in data and data[f] == "":
                    data[f] = None
        return data


