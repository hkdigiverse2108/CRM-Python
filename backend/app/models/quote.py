"""
Quote Domain Model
==================
Represents estimation proposals in the Finance & Billing module.
"""

from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from typing import Optional
import uuid


@dataclass
class Quote:
    """Finance Quote entity."""

    id: str = field(default_factory=lambda: f"QT-2026-{str(uuid.uuid4())[:6].upper()}")
    tenant_id: str = ""
    client: str = ""
    quote_date: date = field(default_factory=date.today)
    valid_until: date = field(default_factory=date.today)
    status: str = "Sent"
    product_name: str = "General Proposal"
    quantity: int = 1
    price: float = 0.0
    discount: float = 0.0
    tax: float = 0.0
    total: float = 0.0
    notes: Optional[str] = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "tenantId": self.tenant_id,
            "client": self.client,
            "date": self.quote_date.isoformat() if self.quote_date else "",
            "validUntil": self.valid_until.isoformat() if self.valid_until else "",
            "status": self.status,
            "productName": self.product_name,
            "quantity": self.quantity,
            "price": self.price,
            "discount": self.discount,
            "tax": self.tax,
            "total": self.total,
            "notes": self.notes or "",
            "createdAt": self.created_at.isoformat() if self.created_at else "",
            "updatedAt": self.updated_at.isoformat() if self.updated_at else "",
        }
