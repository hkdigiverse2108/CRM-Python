"""
Product Domain Model
====================
Represents a product in the E-Commerce module.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional, List
import uuid


@dataclass
class Product:
    """E-Commerce product entity."""

    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str = ""
    name: str = ""
    sku: str = ""
    category: str = "Electronics"
    brand: str = "Generic"
    status: str = "Active"
    cost_price: float = 0.0
    retail_price: float = 0.0
    tax: float = 0.0
    discount: float = 0.0
    stock_quantity: int = 0
    safety_stock: int = 5
    warehouse: str = "Chicago"
    platforms: List[str] = field(default_factory=lambda: ["Amazon", "Flipkart"])
    description: Optional[str] = None
    notes: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "tenantId": self.tenant_id,
            "name": self.name,
            "sku": self.sku,
            "category": self.category,
            "brand": self.brand,
            "status": self.status,
            "cost": self.cost_price,
            "price": self.retail_price,
            "tax": self.tax,
            "discount": self.discount,
            "stock": self.stock_quantity,
            "safetyStock": self.safety_stock,
            "warehouse": self.warehouse,
            "platforms": self.platforms or [],
            "description": self.description or "",
            "notes": self.notes or "",
            "image": self.image_url or "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=100&q=80",
            "createdAt": self.created_at.isoformat() if self.created_at else "",
            "updatedAt": self.updated_at.isoformat() if self.updated_at else "",
        }
