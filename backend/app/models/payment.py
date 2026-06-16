"""
Payment Domain Model
====================
Represents a payment transaction in the Finance & Billing module.
"""

from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from typing import Optional
import uuid


@dataclass
class Payment:
    """Finance Payment entity."""

    id: str = field(default_factory=lambda: f"PAY-{str(uuid.uuid4())[:6].upper()}")
    tenant_id: str = ""
    invoice_id: str = ""
    client: str = ""
    amount: float = 0.0
    method: str = "UPI"
    reference: Optional[str] = None
    payment_date: date = field(default_factory=date.today)
    status: str = "Completed"
    remarks: Optional[str] = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "tenantId": self.tenant_id,
            "invoiceId": self.invoice_id,
            "client": self.client,
            "amount": self.amount,
            "method": self.method,
            "reference": self.reference or "",
            "date": self.payment_date.isoformat() if self.payment_date else "",
            "status": self.status,
            "remarks": self.remarks or "",
            "createdAt": self.created_at.isoformat() if self.created_at else "",
            "updatedAt": self.updated_at.isoformat() if self.updated_at else "",
        }
