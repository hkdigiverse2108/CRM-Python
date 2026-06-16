"""
Contact CRUD Pydantic Schemas
=============================
Request/response models for contact management endpoints.
"""

import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class ContactCreate(BaseModel):
    """POST /contacts"""
    name: str = Field(..., min_length=1, max_length=255)
    company: Optional[str] = None
    role: Optional[str] = None  # designation
    department: Optional[str] = None
    phone: Optional[str] = None
    altPhone: Optional[str] = None
    email: Optional[str] = None
    whatsapp: Optional[str] = None
    website: Optional[str] = None
    address1: Optional[str] = None
    address2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "India"
    postalCode: Optional[str] = None
    birthday: Optional[datetime.date] = None
    anniversary: Optional[datetime.date] = None
    notes: Optional[str] = None
    tags: List[str] = []
    contact_type: Optional[str] = "customer"
    is_active: Optional[bool] = True


class ContactUpdate(BaseModel):
    """PUT /contacts/{id}"""
    name: Optional[str] = None
    company: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    altPhone: Optional[str] = None
    email: Optional[str] = None
    whatsapp: Optional[str] = None
    website: Optional[str] = None
    address1: Optional[str] = None
    address2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postalCode: Optional[str] = None
    birthday: Optional[datetime.date] = None
    anniversary: Optional[datetime.date] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    contact_type: Optional[str] = None
    is_active: Optional[bool] = None
