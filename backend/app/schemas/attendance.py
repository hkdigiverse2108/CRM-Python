import datetime
from typing import Optional
from pydantic import BaseModel, Field


class AttendanceCreate(BaseModel):
    employeeId: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)
    role: str = Field(..., min_length=1)
    date: datetime.date
    checkIn: Optional[str] = None
    checkOut: Optional[str] = None
    workingHours: Optional[float] = 0.0
    breakDuration: Optional[str] = None
    overtimeHours: Optional[float] = 0.0
    method: Optional[str] = "Manual Entry"
    status: Optional[str] = "Present"
    active: Optional[bool] = False


class AttendanceUpdate(BaseModel):
    checkIn: Optional[str] = None
    checkOut: Optional[str] = None
    workingHours: Optional[float] = None
    breakDuration: Optional[str] = None
    overtimeHours: Optional[float] = None
    status: Optional[str] = None
    active: Optional[bool] = None
    method: Optional[str] = None
