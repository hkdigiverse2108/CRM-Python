import datetime
from typing import Optional
from pydantic import BaseModel, Field


class LeaveCreate(BaseModel):
    employeeId: str = Field(..., min_length=1)
    employeeName: str = Field(..., min_length=1)
    department: str = Field(..., min_length=1)
    type: str = Field(..., min_length=1)
    startDate: datetime.date
    endDate: datetime.date
    days: int = Field(..., gt=0)
    reason: Optional[str] = None
    status: Optional[str] = "Pending"


class LeaveUpdate(BaseModel):
    status: Optional[str] = None  # e.g., Approved, Rejected, Pending
    reason: Optional[str] = None
    type: Optional[str] = None
    startDate: Optional[datetime.date] = None
    endDate: Optional[datetime.date] = None
    days: Optional[int] = None
