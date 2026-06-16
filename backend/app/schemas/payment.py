"""
Payment API Schemas
===================
Pydantic validation schemas for Payment request payloads and responses.
"""

import datetime
from typing import Optional
from pydantic import BaseModel, Field


class PaymentCreate(BaseModel):
    id: Optional[str] = None
    invoice_id: str = Field(..., min_length=1)
    client: str = Field(..., min_length=1)
    amount: float = Field(..., ge=0.0)
    method: str = Field("UPI", min_length=1)
    reference: Optional[str] = None
    date: Optional[datetime.date] = None
    status: Optional[str] = "Completed"
    remarks: Optional[str] = None


class PaymentUpdate(BaseModel):
    invoice_id: Optional[str] = None
    client: Optional[str] = None
    amount: Optional[float] = None
    method: Optional[str] = None
    reference: Optional[str] = None
    date: Optional[datetime.date] = None
    status: Optional[str] = None
    remarks: Optional[str] = None
