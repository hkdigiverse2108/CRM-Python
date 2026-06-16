"""
Product Repository
==================
Concrete MySQL database implementation of product data access.
Implements multi-tenant row-level isolation using workspace_id,
soft deletes using deleted_at.
"""

import uuid
import json
from datetime import datetime, timezone
from typing import Any, Optional
import anyio
from sqlalchemy import text

from backend.app.models.product import Product
from backend.app.repositories.base import BaseRepository
from backend.app.core.database import get_db


class ProductRepository(BaseRepository[Product]):
    """
    MySQL database repository for E-Commerce products.
    Filters all queries by workspace_id to guarantee tenant data isolation.
    """

    def _row_to_product(self, row: dict[str, Any]) -> Product:
        """Helper to construct a Product domain model from a database row."""
        created_at = row["created_at"]
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        elif created_at and not created_at.tzinfo:
            created_at = created_at.replace(tzinfo=timezone.utc)

        updated_at = row["updated_at"]
        if isinstance(updated_at, str):
            updated_at = datetime.fromisoformat(updated_at)
        elif updated_at and not updated_at.tzinfo:
            updated_at = updated_at.replace(tzinfo=timezone.utc)

        platforms = []
        if row.get("platforms"):
            try:
                platforms = json.loads(row["platforms"]) if isinstance(row["platforms"], str) else row["platforms"]
            except Exception:
                platforms = []

        return Product(
            id=row["product_id"],
            tenant_id=row["workspace_id"],
            name=row["name"],
            sku=row.get("sku") or "",
            category=row.get("category") or "Electronics",
            brand=row.get("brand") or "Generic",
            status=row.get("status") or "Active",
            cost_price=float(row.get("cost_price") or 0.0),
            retail_price=float(row.get("retail_price") or 0.0),
            tax=float(row.get("tax") or 0.0),
            discount=float(row.get("discount") or 0.0),
            stock_quantity=int(row.get("stock_quantity") or 0),
            safety_stock=int(row.get("safety_stock") or 5),
            warehouse=row.get("warehouse") or "Chicago",
            platforms=platforms,
            description=row.get("description"),
            notes=row.get("notes"),
            image_url=row.get("image_url"),
            created_at=created_at or datetime.now(timezone.utc),
            updated_at=updated_at or datetime.now(timezone.utc),
        )

    async def get_by_id(self, entity_id: str, tenant_id: str) -> Optional[Product]:
        """Retrieve a product by ID, filtered by workspace_id."""
        def _get():
            with get_db() as db:
                sql = text("""
                    SELECT * FROM ecommerce_products 
                    WHERE product_id = :product_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {"product_id": entity_id, "workspace_id": tenant_id}).mappings().first()
                if not res:
                    return None
                return self._row_to_product(res)
        return await anyio.to_thread.run_sync(_get)

    async def get_all(
        self, tenant_id: str, filters: Optional[dict[str, Any]] = None,
        skip: int = 0, limit: int = 100,
    ) -> list[Product]:
        """Retrieve paginated products filtered by workspace_id and optional filters."""
        def _get_all():
            with get_db() as db:
                query_str = """
                    SELECT * FROM ecommerce_products 
                    WHERE workspace_id = :workspace_id AND deleted_at IS NULL
                """
                params = {"workspace_id": tenant_id}
                if filters:
                    if "status" in filters:
                        query_str += " AND status = :status"
                        params["status"] = filters["status"]
                    if "category" in filters:
                        query_str += " AND category = :category"
                        params["category"] = filters["category"]
                    if "search" in filters and filters["search"]:
                        search_term = filters["search"].strip()[:100]
                        if search_term:
                            query_str += " AND MATCH(name, sku, category, brand, description) AGAINST(:search IN NATURAL LANGUAGE MODE)"
                            params["search"] = search_term

                query_str += " ORDER BY created_at DESC LIMIT :limit OFFSET :skip"
                params["limit"] = limit
                params["skip"] = skip

                res = db.execute(text(query_str), params).mappings().all()
                return [self._row_to_product(r) for r in res]
        return await anyio.to_thread.run_sync(_get_all)

    async def create(self, entity: Product) -> Product:
        """Create a new product."""
        def _create():
            with get_db() as db:
                sql = text("""
                    INSERT INTO ecommerce_products (
                        product_id, workspace_id, name, sku, category, brand, status,
                        cost_price, retail_price, tax, discount,
                        stock_quantity, safety_stock, warehouse, platforms,
                        description, notes, image_url, created_at, updated_at
                    ) VALUES (
                        :product_id, :workspace_id, :name, :sku, :category, :brand, :status,
                        :cost_price, :retail_price, :tax, :discount,
                        :stock_quantity, :safety_stock, :warehouse, :platforms,
                        :description, :notes, :image_url, :created_at, :updated_at
                    )
                """)
                db.execute(sql, {
                    "product_id": entity.id,
                    "workspace_id": entity.tenant_id,
                    "name": entity.name,
                    "sku": entity.sku,
                    "category": entity.category,
                    "brand": entity.brand,
                    "status": entity.status,
                    "cost_price": entity.cost_price,
                    "retail_price": entity.retail_price,
                    "tax": entity.tax,
                    "discount": entity.discount,
                    "stock_quantity": entity.stock_quantity,
                    "safety_stock": entity.safety_stock,
                    "warehouse": entity.warehouse,
                    "platforms": json.dumps(entity.platforms),
                    "description": entity.description,
                    "notes": entity.notes,
                    "image_url": entity.image_url,
                    "created_at": entity.created_at,
                    "updated_at": entity.updated_at,
                })
                db.commit()
                return entity
        return await anyio.to_thread.run_sync(_create)

    async def update(self, entity_id: str, tenant_id: str, data: dict[str, Any]) -> Optional[Product]:
        """Update a product's record in the database."""
        def _update():
            with get_db() as db:
                set_clauses = []
                params = {"product_id": entity_id, "workspace_id": tenant_id}

                # Map frontend camelCase keys to DB snake_case columns
                field_map = {
                    "name": "name",
                    "sku": "sku",
                    "category": "category",
                    "brand": "brand",
                    "status": "status",
                    "cost_price": "cost_price",
                    "retail_price": "retail_price",
                    "tax": "tax",
                    "discount": "discount",
                    "stock_quantity": "stock_quantity",
                    "safety_stock": "safety_stock",
                    "warehouse": "warehouse",
                    "platforms": "platforms",
                    "description": "description",
                    "notes": "notes",
                    "image_url": "image_url",
                }

                for key, val in data.items():
                    db_col = field_map.get(key, key)
                    if db_col == "platforms":
                        set_clauses.append(f"{db_col} = :{db_col}")
                        params[db_col] = json.dumps(val) if val is not None else None
                    elif db_col in field_map.values():
                        set_clauses.append(f"{db_col} = :{db_col}")
                        params[db_col] = val

                if not set_clauses:
                    return None

                set_clauses.append("updated_at = :updated_at")
                params["updated_at"] = datetime.now(timezone.utc)

                sql = text(f"""
                    UPDATE ecommerce_products 
                    SET {", ".join(set_clauses)}
                    WHERE product_id = :product_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, params)
                db.commit()

                if res.rowcount == 0:
                    return None

        await anyio.to_thread.run_sync(_update)
        return await self.get_by_id(entity_id, tenant_id)

    async def delete(self, entity_id: str, tenant_id: str) -> bool:
        """Soft-delete a product by setting deleted_at timestamp."""
        def _delete():
            with get_db() as db:
                sql = text("""
                    UPDATE ecommerce_products 
                    SET deleted_at = :deleted_at 
                    WHERE product_id = :product_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {
                    "product_id": entity_id,
                    "workspace_id": tenant_id,
                    "deleted_at": datetime.now(timezone.utc),
                })
                db.commit()
                return res.rowcount > 0
        return await anyio.to_thread.run_sync(_delete)

    async def count(self, tenant_id: str, filters: Optional[dict[str, Any]] = None) -> int:
        """Count total non-deleted products for a tenant."""
        def _count():
            with get_db() as db:
                query_str = "SELECT COUNT(*) FROM ecommerce_products WHERE workspace_id = :workspace_id AND deleted_at IS NULL"
                params = {"workspace_id": tenant_id}
                if filters:
                    if "status" in filters:
                        query_str += " AND status = :status"
                        params["status"] = filters["status"]
                    if "category" in filters:
                        query_str += " AND category = :category"
                        params["category"] = filters["category"]

                res = db.execute(text(query_str), params).scalar()
                return res or 0
        return await anyio.to_thread.run_sync(_count)


_product_repo = ProductRepository()

def get_product_repository() -> ProductRepository:
    return _product_repo
