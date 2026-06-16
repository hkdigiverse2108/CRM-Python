"""
Expense API Schemas
===================
Pydantic validation schemas for Expense request payloads and responses.
"""

import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ExpenseCreate(BaseModel):
    id: Optional[str] = None
    date: Optional[datetime.date] = None
    payee: str = Field(..., min_length=1)
    category: str = Field("Cloud Infrastructure", min_length=1)
    method: str = Field("Corporate Card", min_length=1)
    amount: float = Field(..., ge=0.0)
    status: Optional[str] = "Pending Review"


class ExpenseUpdate(BaseModel):
    date: Optional[datetime.date] = None
    payee: Optional[str] = None
    category: Optional[str] = None
    method: Optional[str] = None
    amount: Optional[float] = None
    status: Optional[str] = None
