from typing import Optional
from pydantic import BaseModel, Field


class ReminderCreate(BaseModel):
    desc: str = Field(..., min_length=1)
    type: Optional[str] = "Call"
    time: str = Field(..., min_length=1)  # "YYYY-MM-DD HH:MM"
    priority: Optional[str] = "Medium"
    linkedTo: Optional[str] = "Vikram Patel"
    completed: Optional[bool] = False


class ReminderUpdate(BaseModel):
    desc: Optional[str] = None
    type: Optional[str] = None
    time: Optional[str] = None
    priority: Optional[str] = None
    linkedTo: Optional[str] = None
    completed: Optional[bool] = None
