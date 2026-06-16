"""
Expense Domain Model
====================
Represents a business expense claim in the Finance & Billing module.
"""

from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from typing import Optional
import uuid


@dataclass
class Expense:
    """Finance Expense entity."""

    id: str = field(default_factory=lambda: f"EXP-{str(uuid.uuid4())[:6].upper()}")
    tenant_id: str = ""
    expense_date: date = field(default_factory=date.today)
    payee: str = ""
    category: str = "Cloud Infrastructure"
    method: str = "Corporate Card"
    amount: float = 0.0
    status: str = "Pending Review"
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "tenantId": self.tenant_id,
            "date": self.expense_date.isoformat() if self.expense_date else "",
            "payee": self.payee,
            "category": self.category,
            "method": self.method,
            "amount": self.amount,
            "status": self.status,
            "createdAt": self.created_at.isoformat() if self.created_at else "",
            "updatedAt": self.updated_at.isoformat() if self.updated_at else "",
        }
