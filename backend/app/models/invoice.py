"""
Invoice Domain Model
====================
Represents a customer invoice in the Finance & Billing module.
"""

from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from typing import Optional, List, Dict, Any
import uuid


@dataclass
class Invoice:
    """Finance invoice entity."""

    id: str = field(default_factory=lambda: f"INV-2026-{str(uuid.uuid4())[:6].upper()}")
    tenant_id: str = ""
    client: str = ""
    email: Optional[str] = None
    invoice_date: date = field(default_factory=date.today)
    due_date: date = field(default_factory=date.today)
    status: str = "Pending"
    subtotal: float = 0.0
    cgst: float = 0.0
    sgst: float = 0.0
    tax: float = 0.0
    discount: float = 0.0
    total: float = 0.0
    payment_method: str = "UPI"
    notes: Optional[str] = None
    items: List[Dict[str, Any]] = field(default_factory=list)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "tenantId": self.tenant_id,
            "client": self.client,
            "email": self.email or "",
            "date": self.invoice_date.isoformat() if self.invoice_date else "",
            "dueDate": self.due_date.isoformat() if self.due_date else "",
            "status": self.status,
            "subtotal": self.subtotal,
            "cgst": self.cgst,
            "sgst": self.sgst,
            "tax": self.tax,
            "discount": self.discount,
            "total": self.total,
            "paymentMethod": self.payment_method,
            "notes": self.notes or "",
            "items": self.items or [],
            "createdAt": self.created_at.isoformat() if self.created_at else "",
            "updatedAt": self.updated_at.isoformat() if self.updated_at else "",
        }
