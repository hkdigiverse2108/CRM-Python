"""
Invoice API Schemas
===================
Pydantic validation schemas for Invoice request payloads and responses.
"""

import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class InvoiceItemSchema(BaseModel):
    desc: str
    hsn: Optional[str] = "998314"
    qty: int = Field(default=1, ge=1)
    rate: float = Field(default=0.0, ge=0.0)
    amount: float = Field(default=0.0, ge=0.0)


class InvoiceCreate(BaseModel):
    id: Optional[str] = None
    client: str = Field(..., min_length=1)
    email: Optional[str] = None
    date: Optional[datetime.date] = None
    due_date: Optional[datetime.date] = None
    status: Optional[str] = "Pending"
    discount: Optional[float] = 0.0
    tax: Optional[float] = 0.0
    payment_method: Optional[str] = "UPI"
    notes: Optional[str] = None
    items: List[InvoiceItemSchema] = []


class InvoiceUpdate(BaseModel):
    client: Optional[str] = None
    email: Optional[str] = None
    date: Optional[datetime.date] = None
    due_date: Optional[datetime.date] = None
    status: Optional[str] = None
    discount: Optional[float] = None
    tax: Optional[float] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    items: Optional[List[InvoiceItemSchema]] = None
