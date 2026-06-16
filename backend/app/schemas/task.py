import datetime
from typing import Optional
from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1)
    type: Optional[str] = "Task"
    priority: Optional[str] = "Medium"
    status: Optional[str] = "To Do"
    assignee: Optional[str] = "Arjun Mehta"
    startDate: Optional[datetime.date] = None
    dueDate: Optional[datetime.date] = None
    reminderDate: Optional[datetime.date] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    project: Optional[str] = "General"


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assignee: Optional[str] = None
    startDate: Optional[datetime.date] = None
    dueDate: Optional[datetime.date] = None
    reminderDate: Optional[datetime.date] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    project: Optional[str] = None
