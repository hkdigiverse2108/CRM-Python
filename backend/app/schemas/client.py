"""
Client CRUD Pydantic Schemas
============================
Request/response models for client management endpoints.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ClientCreate(BaseModel):
    """POST /clients"""
    name: str = Field(..., min_length=1, max_length=255)
    industry: Optional[str] = None
    businessType: Optional[str] = None
    gstNumber: Optional[str] = None
    panNumber: Optional[str] = None
    website: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    altPhone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "India"
    postalCode: Optional[str] = None
    annualRevenue: Optional[float] = 0.0
    employeesCount: Optional[int] = 0
    companySize: Optional[str] = "1-10"
    ownerName: Optional[str] = None
    accountManager: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = "Active"


class ClientUpdate(BaseModel):
    """PUT /clients/{id}"""
    name: Optional[str] = None
    industry: Optional[str] = None
    businessType: Optional[str] = None
    gstNumber: Optional[str] = None
    panNumber: Optional[str] = None
    website: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    altPhone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postalCode: Optional[str] = None
    annualRevenue: Optional[float] = None
    employeesCount: Optional[int] = None
    companySize: Optional[str] = None
    ownerName: Optional[str] = None
    accountManager: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    projects: Optional[List[Dict[str, Any]]] = None
    activities: Optional[List[Dict[str, Any]]] = None
    files: Optional[List[Dict[str, Any]]] = None
    tasks: Optional[List[Dict[str, Any]]] = None
