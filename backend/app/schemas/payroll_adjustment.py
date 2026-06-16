import datetime
from typing import Optional
from pydantic import BaseModel, Field

class PayrollAdjustmentCreate(BaseModel):
    employeeId: str = Field(..., min_length=1)
    employeeName: str = Field(..., min_length=1)
    type: str = Field(..., min_length=1) # "BONUS" or "DEDUCTION"
    amount: float = Field(..., ge=0.0)
    date: datetime.date
    reason: str = Field(..., min_length=1)
