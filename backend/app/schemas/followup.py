"""
Lead Followup Schemas
=====================
Request/response Pydantic models for lead followup endpoints.
"""

from datetime import date, time
from typing import Optional
from pydantic import BaseModel, Field


class FollowupCreate(BaseModel):
    """POST /leads/{lead_id}/followups"""
    followup_date: date
    followup_time: Optional[time] = None
    followup_type: str = Field(default="Call")
    remarks: str = Field(..., min_length=1)
    next_followup_date: Optional[date] = None
    next_followup_remarks: Optional[str] = None


class FollowupResponse(BaseModel):
    """Followup entity in API responses."""
    id: str
    workspace_id: str
    lead_id: str
    followup_date: date
    followup_time: Optional[str] = None
    followup_type: str
    remarks: str
    status: str
    created_by: Optional[str] = None
    created_at: str
    next_followup_date: Optional[date] = None
    next_followup_remarks: Optional[str] = None
