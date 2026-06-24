"""
Lead CRUD Schemas
==================
Request/response models for lead management endpoints.
"""

from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class LeadCreate(BaseModel):
    """POST /leads"""
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    phone: Optional[str] = None
    company: Optional[str] = None
    source: str = Field(
        default="website",
        pattern=r"^(website|whatsapp|meta_ads|referral|cold_call|indiamart|justdial|tradeindia)$",
    )
    value: float = Field(default=0.0, ge=0)
    notes: Optional[str] = None


class LeadUpdate(BaseModel):
    """PUT /leads/{id}"""
    name: Optional[str] = Field(default=None, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = Field(
        default=None,
        pattern=r"^(New Lead|Contacted|Follow-up|Negotiation|Hot Lead|Proposal Sent|Converted|new lead|contacted|follow-up|negotiation|hot lead|proposal sent|converted|new|qualified|won|lost)$",
    )
    score: Optional[int] = Field(default=None, ge=0, le=100)
    assigned_to: Optional[str] = None
    value: Optional[float] = Field(default=None, ge=0)
    notes: Optional[str] = None


class LeadResponse(BaseModel):
    """Lead entity in API responses."""
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    company: Optional[str] = None
    source: str
    status: str
    score: int
    assigned_to: Optional[str] = None
    created_by: Optional[str] = None
    tenant_id: str
    notes: Optional[str] = None
    value: float
    created_at: str
    updated_at: str
    next_followup_date: Optional[str] = None
