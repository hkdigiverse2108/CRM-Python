"""
Product Management Routes
=========================
CRUD endpoints for managing e-commerce products.
"""

from fastapi import APIRouter, Depends, Query, Request

from backend.app.schemas.product import ProductCreate, ProductUpdate
from backend.app.services.product_service import ProductService, get_product_service
from backend.app.api.dependencies.auth import get_current_user, PermissionChecker
from backend.app.utils.response import success_response

router = APIRouter()


@router.get("", dependencies=[Depends(PermissionChecker("ecommerce", "view"))])
async def list_products(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(100, ge=1, le=500),
    status: str | None = None,
    category: str | None = None,
    search: str | None = None,
    product_service: ProductService = Depends(get_product_service),
):
    """
    List products with pagination and filtering.
    """
    tenant_id = request.state.tenant.id
    filters = {}
    if status:
        filters["status"] = status
    if category:
        filters["category"] = category
    if search:
        filters["search"] = search

    result = await product_service.list_products(
        tenant_id=tenant_id,
        filters=filters,
        page=page,
        per_page=per_page,
    )
    return success_response(
        data=result["items"],
        message="Products listed successfully",
        meta=result["meta"],
    )


@router.get("/{product_id}", dependencies=[Depends(PermissionChecker("ecommerce", "view"))])
async def get_product(
    request: Request,
    product_id: str,
    product_service: ProductService = Depends(get_product_service),
):
    """
    Retrieve details of a specific product.
    """
    tenant_id = request.state.tenant.id
    product = await product_service.get_product(product_id=product_id, tenant_id=tenant_id)
    return success_response(data=product, message="Product retrieved successfully")


@router.post("", dependencies=[Depends(PermissionChecker("ecommerce", "create"))])
async def create_product(
    request: Request,
    payload: ProductCreate,
    product_service: ProductService = Depends(get_product_service),
):
    """
    Create a new product under the current tenant.
    """
    tenant_id = request.state.tenant.id
    product = await product_service.create_product(
        data=payload.model_dump(),
        tenant_id=tenant_id,
    )
    return success_response(data=product, message="Product created successfully", status_code=201)


@router.put("/{product_id}", dependencies=[Depends(PermissionChecker("ecommerce", "edit"))])
async def update_product(
    request: Request,
    product_id: str,
    payload: ProductUpdate,
    product_service: ProductService = Depends(get_product_service),
):
    """
    Update details of an existing product.
    """
    tenant_id = request.state.tenant.id
    updated_product = await product_service.update_product(
        product_id=product_id,
        tenant_id=tenant_id,
        data=payload.model_dump(exclude_unset=True),
    )
    return success_response(data=updated_product, message="Product updated successfully")


@router.delete("/{product_id}", dependencies=[Depends(PermissionChecker("ecommerce", "delete"))])
async def delete_product(
    request: Request,
    product_id: str,
    product_service: ProductService = Depends(get_product_service),
):
    """
    Delete a product from the workspace.
    """
    tenant_id = request.state.tenant.id
    await product_service.delete_product(product_id=product_id, tenant_id=tenant_id)
    return success_response(message="Product deleted successfully")

