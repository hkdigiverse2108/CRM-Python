"""
Quote API Schemas
=================
Pydantic validation schemas for Quote request payloads and responses.
"""

import datetime
from typing import Optional
from pydantic import BaseModel, Field


class QuoteCreate(BaseModel):
    id: Optional[str] = None
    client: str = Field(..., min_length=1)
    date: Optional[datetime.date] = None
    valid_until: Optional[datetime.date] = None
    status: Optional[str] = "Sent"
    product_name: str = Field("General Proposal", min_length=1)
    quantity: Optional[int] = Field(1, ge=1)
    price: Optional[float] = Field(0.0, ge=0.0)
    discount: Optional[float] = Field(0.0, ge=0.0)
    tax: Optional[float] = Field(0.0, ge=0.0)
    total: Optional[float] = Field(0.0, ge=0.0)
    notes: Optional[str] = None


class QuoteUpdate(BaseModel):
    client: Optional[str] = None
    date: Optional[datetime.date] = None
    valid_until: Optional[datetime.date] = None
    status: Optional[str] = None
    product_name: Optional[str] = None
    quantity: Optional[int] = None
    price: Optional[float] = None
    discount: Optional[float] = None
    tax: Optional[float] = None
    total: Optional[float] = None
    notes: Optional[str] = None
