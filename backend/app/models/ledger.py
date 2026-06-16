"""
Ledger Domain Model
===================
Represents a journal entry in the General Ledger.
"""

from dataclasses import dataclass, field
from datetime import date, datetime, timezone
import uuid


@dataclass
class LedgerEntry:
    """General Ledger transaction entry."""

    id: str = field(default_factory=lambda: f"LDG-{str(uuid.uuid4())[:6].upper()}")
    tenant_id: str = ""
    entry_date: date = field(default_factory=date.today)
    description: str = ""
    debit: float = 0.0
    credit: float = 0.0
    balance: float = 0.0
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "tenantId": self.tenant_id,
            "date": self.entry_date.isoformat() if self.entry_date else "",
            "description": self.description,
            "debit": self.debit,
            "credit": self.credit,
            "balance": self.balance,
            "createdAt": self.created_at.isoformat() if self.created_at else "",
            "updatedAt": self.updated_at.isoformat() if self.updated_at else "",
        }
