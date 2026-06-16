import datetime
from typing import Optional
from pydantic import BaseModel, Field

class LetterRequestCreate(BaseModel):
    employeeId: str = Field(..., min_length=1)
    letterType: str = Field(..., min_length=1)
    reason: str = Field(..., min_length=1)

class LetterRequestUpdate(BaseModel):
    status: Optional[str] = None
    actionsTaken: Optional[str] = None

class DocumentUploadCreate(BaseModel):
    employeeId: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)
    type: str = Field(..., min_length=1)
