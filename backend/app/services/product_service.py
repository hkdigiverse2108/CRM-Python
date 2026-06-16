"""
Product Service
===============
Business logic for product CRUD operations.
"""

from typing import Any, Optional

from backend.app.models.product import Product
from backend.app.repositories.product_repo import ProductRepository, get_product_repository
from backend.app.utils.exceptions import NotFoundException


class ProductService:
    """Product management business logic."""

    def __init__(self, product_repo: ProductRepository | None = None) -> None:
        self._repo = product_repo or get_product_repository()

    async def get_product(self, product_id: str, tenant_id: str) -> dict:
        product = await self._repo.get_by_id(product_id, tenant_id)
        if product is None:
            raise NotFoundException(f"Product '{product_id}' not found")
        return product.to_dict()

    async def list_products(
        self, tenant_id: str, filters: Optional[dict[str, Any]] = None,
        page: int = 1, per_page: int = 100,
    ) -> dict:
        skip = (page - 1) * per_page
        products = await self._repo.get_all(tenant_id, filters, skip=skip, limit=per_page)
        total = await self._repo.count(tenant_id, filters)
        return {
            "items": [p.to_dict() for p in products],
            "meta": {
                "page": page, "per_page": per_page,
                "total": total, "total_pages": (total + per_page - 1) // per_page,
            },
        }

    async def create_product(self, data: dict[str, Any], tenant_id: str) -> dict:
        product = Product(
            tenant_id=tenant_id,
            name=data["name"],
            sku=data.get("sku", ""),
            category=data.get("category", "Electronics"),
            brand=data.get("brand", "Generic"),
            status=data.get("status", "Active"),
            cost_price=data.get("cost_price", 0.0),
            retail_price=data.get("retail_price", 0.0),
            tax=data.get("tax", 0.0),
            discount=data.get("discount", 0.0),
            stock_quantity=data.get("stock_quantity", 0),
            safety_stock=data.get("safety_stock", 5),
            warehouse=data.get("warehouse", "Chicago"),
            platforms=data.get("platforms") or ["Amazon", "Flipkart"],
            description=data.get("description"),
            notes=data.get("notes"),
            image_url=data.get("image_url"),
        )
        created = await self._repo.create(product)
        return created.to_dict()

    async def update_product(self, product_id: str, tenant_id: str, data: dict[str, Any]) -> dict:
        updated = await self._repo.update(product_id, tenant_id, data)
        if updated is None:
            raise NotFoundException(f"Product '{product_id}' not found")
        return updated.to_dict()

    async def delete_product(self, product_id: str, tenant_id: str) -> bool:
        deleted = await self._repo.delete(product_id, tenant_id)
        if not deleted:
            raise NotFoundException(f"Product '{product_id}' not found")
        return True


_product_service = ProductService()

def get_product_service() -> ProductService:
    return _product_service
