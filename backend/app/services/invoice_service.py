"""
Invoice Service
===============
Coordinates business logic for Invoice operations.
"""

from typing import Any, Optional
from datetime import date

from backend.app.models.invoice import Invoice
from backend.app.repositories.invoice_repo import InvoiceRepository, get_invoice_repository


class InvoiceService:
    """Service layer for Invoice operations."""

    def __init__(self, repository: InvoiceRepository):
        self.repository = repository

    async def list_invoices(
        self, tenant_id: str, filters: Optional[dict[str, Any]] = None,
        page: int = 1, per_page: int = 100
    ) -> dict[str, Any]:
        skip = (page - 1) * per_page
        items = await self.repository.get_all(tenant_id, filters, skip, per_page)
        total = await self.repository.count(tenant_id, filters)
        return {
            "items": [item.to_dict() for item in items],
            "meta": {
                "total": total,
                "page": page,
                "per_page": per_page,
                "pages": (total + per_page - 1) // per_page if total else 1
            }
        }

    async def get_invoice(self, invoice_id: str, tenant_id: str) -> Optional[dict[str, Any]]:
        invoice = await self.repository.get_by_id(invoice_id, tenant_id)
        return invoice.to_dict() if invoice else None

    async def create_invoice(self, data: dict[str, Any], tenant_id: str) -> dict[str, Any]:
        invoice_items = data.get("items", [])
        
        # Recalculate financial fields to ensure correctness
        subtotal = sum(float(item.get("qty", 1)) * float(item.get("rate", 0)) for item in invoice_items)
        discount = float(data.get("discount") or 0.0)
        custom_tax = float(data.get("tax") or 0.0)
        
        # Auto 18% GST (9% CGST, 9% SGST) if no custom tax is provided
        if custom_tax == 0.0:
            cgst = subtotal * 0.09
            sgst = subtotal * 0.09
            tax = cgst + sgst
        else:
            cgst = custom_tax / 2.0
            sgst = custom_tax / 2.0
            tax = custom_tax
            
        total = subtotal + tax - discount

        invoice_id = data.get("id") or f"INV-2026-{uuid_part()}"
        invoice_date = data.get("date") or date.today()
        due_date = data.get("due_date") or date.today()

        invoice = Invoice(
            id=invoice_id,
            tenant_id=tenant_id,
            client=data["client"],
            email=data.get("email"),
            invoice_date=invoice_date,
            due_date=due_date,
            status=data.get("status") or "Pending",
            subtotal=subtotal,
            cgst=cgst,
            sgst=sgst,
            tax=tax,
            discount=discount,
            total=total,
            payment_method=data.get("payment_method") or "UPI",
            notes=data.get("notes"),
            items=invoice_items
        )

        res = await self.repository.create(invoice)
        return res.to_dict()

    async def update_invoice(self, invoice_id: str, tenant_id: str, data: dict[str, Any]) -> Optional[dict[str, Any]]:
        invoice = await self.repository.get_by_id(invoice_id, tenant_id)
        if not invoice:
            return None

        # Re-calculate totals if items, tax, or discount is being updated
        if "items" in data or "tax" in data or "discount" in data:
            invoice_items = data.get("items") if "items" in data else invoice.items
            subtotal = sum(float(item.get("qty", 1)) * float(item.get("rate", 0)) for item in invoice_items)
            discount = float(data.get("discount") if "discount" in data else invoice.discount)
            custom_tax = float(data.get("tax") if "tax" in data else invoice.tax)
            
            if "tax" in data:
                cgst = custom_tax / 2.0
                sgst = custom_tax / 2.0
                tax = custom_tax
            else:
                cgst = subtotal * 0.09
                sgst = subtotal * 0.09
                tax = cgst + sgst
                
            total = subtotal + tax - discount
            
            data["subtotal"] = subtotal
            data["cgst"] = cgst
            data["sgst"] = sgst
            data["tax"] = tax
            data["total"] = total

        res = await self.repository.update(invoice_id, tenant_id, data)
        return res.to_dict() if res else None

    async def delete_invoice(self, invoice_id: str, tenant_id: str) -> bool:
        return await self.repository.delete(invoice_id, tenant_id)


def uuid_part() -> str:
    import uuid
    return str(uuid.uuid4())[:6].upper()


_invoice_service = InvoiceService(get_invoice_repository())

def get_invoice_service() -> InvoiceService:
    return _invoice_service
