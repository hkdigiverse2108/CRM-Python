"""
Ledger API Schemas
==================
Pydantic validation schemas for General Ledger request payloads and responses.
"""

import datetime
from typing import Optional
from pydantic import BaseModel, Field


class LedgerCreate(BaseModel):
    id: Optional[str] = None
    date: Optional[datetime.date] = None
    description: str = Field(..., min_length=1)
    debit: Optional[float] = Field(0.0, ge=0.0)
    credit: Optional[float] = Field(0.0, ge=0.0)


class LedgerUpdate(BaseModel):
    date: Optional[datetime.date] = None
    description: Optional[str] = None
    debit: Optional[float] = None
    credit: Optional[float] = None
