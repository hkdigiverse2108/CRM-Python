"""
Shopify Integration API Router
==============================
Hosts OAuth, Sync, Status, and Webhook endpoints.
"""

import json
from fastapi import APIRouter, Depends, Request, Header, HTTPException, Query
from fastapi.responses import RedirectResponse, JSONResponse
from jose import jwt
from datetime import datetime, timedelta

from backend.app.core.config import get_settings
from backend.app.schemas.shopify_schema import ShopifyConnectionStatus
from backend.app.services.shopify_service import ShopifyService, get_shopify_service
from backend.app.api.dependencies.auth import get_current_user
from backend.app.utils.response import success_response

router = APIRouter()


@router.get("/connect")
async def connect(
    request: Request,
    shop: str = Query(..., description="The shop domain, e.g. mystore.myshopify.com"),
    tenant_id: str = Query(None, description="The workspace/tenant identifier"),
    redirect_url: str = Query(None, description="The frontend redirect url to return to after success"),
    shopify_service: ShopifyService = Depends(get_shopify_service)
):
    """
    Start OAuth flow.
    Generates Shopify authorize URL and redirects the user.
    """
    # Fallback to header if not in query parameters
    if not tenant_id:
        tenant_id = request.headers.get("X-Tenant-ID")
        if not tenant_id:
            raise HTTPException(status_code=400, detail="X-Tenant-ID header or tenant_id query parameter is required")

    oauth_url = shopify_service.generate_oauth_url(tenant_id=tenant_id, shop=shop, redirect_url=redirect_url)
    return RedirectResponse(url=oauth_url)


@router.get("/callback")
async def callback(
    request: Request,
    code: str = Query(...),
    shop: str = Query(...),
    state: str = Query(...),
    shopify_service: ShopifyService = Depends(get_shopify_service)
):
    """
    OAuth callback endpoint.
    Verifies HMAC and state, exchanges code for access token, and saves the connection.
    """
    # 1. Verify HMAC
    params = dict(request.query_params)
    if not shopify_service.verify_callback_signature(params):
        raise HTTPException(status_code=400, detail="Invalid HMAC signature")

    # 2. Verify state and decode tenant_id and redirect_url
    settings = get_settings()
    try:
        payload = jwt.decode(state, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        tenant_id = payload.get("tenant_id")
        redirect_url = payload.get("redirect_url")
        if not tenant_id:
            raise HTTPException(status_code=400, detail="State token missing tenant_id")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired state token")

    # 3. Exchange code for access token
    token_response = await shopify_service.exchange_code_for_token(shop=shop, code=code)
    access_token = token_response.get("access_token")
    scopes = token_response.get("scope")
    refresh_token = token_response.get("refresh_token")
    expires_in = token_response.get("expires_in")

    if not access_token:
        raise HTTPException(status_code=400, detail="Failed to obtain access token")

    expires_at = None
    if expires_in:
        expires_at = datetime.utcnow() + timedelta(seconds=int(expires_in))

    # 4. Save connection
    shopify_service.save_connection(
        tenant_id=tenant_id,
        shop_domain=shop,
        access_token=access_token,
        scopes=scopes,
        refresh_token=refresh_token,
        expires_at=expires_at
    )

    if redirect_url:
        # Append status=success to redirect URL
        separator = "&" if "?" in redirect_url else "?"
        return RedirectResponse(url=f"{redirect_url}{separator}status=success")

    # Fallback to configured settings frontend url
    frontend_fallback = f"{settings.frontend_url}/admin/integrations/shopify?status=success"
    return RedirectResponse(url=frontend_fallback)


@router.get("/status", response_model=ShopifyConnectionStatus)
async def status(
    request: Request,
    current_user: dict = Depends(get_current_user),
    shopify_service: ShopifyService = Depends(get_shopify_service)
):
    """Retrieve Shopify connection status for the tenant."""
    tenant_id = current_user.get("tenant_id") or request.headers.get("X-Tenant-ID")
    conn = await shopify_service.get_connection(tenant_id)
    if not conn:
        return {"connected": False}

    return {
        "connected": True,
        "shop": conn["shop_domain"],
        "last_sync": conn["updated_at"].isoformat() if isinstance(conn["updated_at"], datetime) else str(conn["updated_at"])
    }


@router.delete("/disconnect")
async def disconnect(
    request: Request,
    current_user: dict = Depends(get_current_user),
    shopify_service: ShopifyService = Depends(get_shopify_service)
):
    """Disconnect Shopify integration for the tenant."""
    tenant_id = current_user.get("tenant_id") or request.headers.get("X-Tenant-ID")
    success = shopify_service.disconnect(tenant_id)
    if not success:
        raise HTTPException(status_code=404, detail="No Shopify connection found to disconnect")
    
    return success_response(message="Shopify disconnected successfully")


# ── Synchronization Endpoints ─────────────────────────────────

@router.get("/sync/products")
async def sync_products(
    request: Request,
    current_user: dict = Depends(get_current_user),
    shopify_service: ShopifyService = Depends(get_shopify_service)
):
    tenant_id = current_user.get("tenant_id") or request.headers.get("X-Tenant-ID")
    count = await shopify_service.sync_products(tenant_id)
    return success_response(data={"synced_count": count}, message="Products synced successfully")


@router.get("/sync/customers")
async def sync_customers(
    request: Request,
    current_user: dict = Depends(get_current_user),
    shopify_service: ShopifyService = Depends(get_shopify_service)
):
    tenant_id = current_user.get("tenant_id") or request.headers.get("X-Tenant-ID")
    count = await shopify_service.sync_customers(tenant_id)
    return success_response(data={"synced_count": count}, message="Customers synced successfully")


@router.get("/sync/orders")
async def sync_orders(
    request: Request,
    current_user: dict = Depends(get_current_user),
    shopify_service: ShopifyService = Depends(get_shopify_service)
):
    tenant_id = current_user.get("tenant_id") or request.headers.get("X-Tenant-ID")
    count = await shopify_service.sync_orders(tenant_id)
    return success_response(data={"synced_count": count}, message="Orders synced successfully")


@router.get("/sync/inventory")
async def sync_inventory(
    request: Request,
    current_user: dict = Depends(get_current_user),
    shopify_service: ShopifyService = Depends(get_shopify_service)
):
    tenant_id = current_user.get("tenant_id") or request.headers.get("X-Tenant-ID")
    count = await shopify_service.sync_inventory(tenant_id)
    return success_response(data={"synced_count": count}, message="Inventory synced successfully")


# ── Webhook Receivers ─────────────────────────────────────────

async def verify_shopify_webhook(request: Request, shopify_service: ShopifyService = Depends(get_shopify_service)):
    """Dependency to verify Shopify webhook HMAC signature."""
    hmac_header = request.headers.get("X-Shopify-Hmac-Sha256")
    shop_domain = request.headers.get("X-Shopify-Shop-Domain")
    
    if not hmac_header or not shop_domain:
        raise HTTPException(status_code=401, detail="Missing Shopify headers")

    raw_body = await request.body()
    if not shopify_service.verify_webhook_signature(raw_body, hmac_header):
        raise HTTPException(status_code=401, detail="Invalid Webhook HMAC signature")

    # Resolve tenant config from shop domain
    conn = await shopify_service.get_connection_by_shop(shop_domain)
    if not conn:
        raise HTTPException(status_code=404, detail="Shop connection not registered")

    return conn["tenant_id"], json.loads(raw_body.decode("utf-8"))


@router.post("/webhook/orders_create")
async def webhook_orders_create(
    webhook_data: tuple = Depends(verify_shopify_webhook),
    shopify_service: ShopifyService = Depends(get_shopify_service)
):
    tenant_id, payload = webhook_data
    shopify_service.handle_webhook_order(tenant_id, payload)
    return {"status": "ok"}


@router.post("/webhook/orders_updated")
async def webhook_orders_updated(
    webhook_data: tuple = Depends(verify_shopify_webhook),
    shopify_service: ShopifyService = Depends(get_shopify_service)
):
    tenant_id, payload = webhook_data
    shopify_service.handle_webhook_order(tenant_id, payload)
    return {"status": "ok"}


@router.post("/webhook/products_create")
async def webhook_products_create(
    webhook_data: tuple = Depends(verify_shopify_webhook),
    shopify_service: ShopifyService = Depends(get_shopify_service)
):
    tenant_id, payload = webhook_data
    shopify_service.handle_webhook_product(tenant_id, payload)
    return {"status": "ok"}


@router.post("/webhook/customers_create")
async def webhook_customers_create(
    webhook_data: tuple = Depends(verify_shopify_webhook),
    shopify_service: ShopifyService = Depends(get_shopify_service)
):
    tenant_id, payload = webhook_data
    shopify_service.handle_webhook_customer(tenant_id, payload)
    return {"status": "ok"}
