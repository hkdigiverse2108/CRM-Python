"""
GST API Schemas
===============
Pydantic validation schemas for GST return filings.
"""

from datetime import date
from typing import Optional
from pydantic import BaseModel, Field


class GstCreate(BaseModel):
    id: Optional[str] = None
    period: str = Field(..., min_length=1)
    collected: Optional[float] = Field(0.0, ge=0.0)
    itc: Optional[float] = Field(0.0, ge=0.0)
    net_due: Optional[float] = Field(0.0, ge=0.0)
    status: Optional[str] = "Draft"
    filed_on: Optional[date] = None


class GstUpdate(BaseModel):
    period: Optional[str] = None
    collected: Optional[float] = None
    itc: Optional[float] = None
    net_due: Optional[float] = None
    status: Optional[str] = None
    filed_on: Optional[date] = None
