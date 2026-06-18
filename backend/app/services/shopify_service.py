"""
Shopify Service Layer
=====================
Orchestrates Shopify OAuth, Webhook HMAC verification, API synchronization,
and database operations for multi-tenant isolation.
"""

import hmac
import hashlib
import base64
import json
from datetime import datetime, timezone, timedelta
from typing import Optional, Any
import httpx
from sqlalchemy import text
from jose import jwt

from backend.app.core.config import get_settings
from backend.app.core.database import get_db
from backend.app.utils.logger import get_logger
from backend.app.utils.exceptions import AppException

logger = get_logger("shopify_service")


class ShopifyService:
    """Service to handle all Shopify operations."""

    def __init__(self):
        pass

    # ── Security & HMAC Verification ──────────────────────────────

    def generate_oauth_url(self, tenant_id: str, shop: str, redirect_url: Optional[str] = None) -> str:
        """
        Generate the Shopify OAuth Authorize URL.
        Includes signed state to prevent CSRF.
        """
        settings = get_settings()
        
        # Clean shop domain
        shop = shop.strip().lower()
        if "://" in shop:
            shop = shop.split("://")[-1]
        shop = shop.strip("/")
        
        if not shop.endswith(".myshopify.com"):
            shop = f"{shop}.myshopify.com"

        # Generate JWT-based state to securely pass tenant_id
        state_payload = {
            "tenant_id": tenant_id,
            "shop": shop,
            "redirect_url": redirect_url,
            "exp": int(datetime.now(timezone.utc).timestamp()) + 900
        }
        
        state_token = jwt.encode(
            state_payload,
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )

        redirect_uri = settings.SHOPIFY_REDIRECT_URI
        scopes = settings.SHOPIFY_SCOPES

        oauth_url = (
            f"https://{shop}/admin/oauth/authorize?"
            f"client_id={settings.SHOPIFY_CLIENT_ID}&"
            f"scope={scopes}&"
            f"redirect_uri={redirect_uri}&"
            f"state={state_token}"
        )
        return oauth_url

    def verify_callback_signature(self, params: dict) -> bool:
        """
        Verify the HMAC signature provided in the Shopify OAuth callback.
        """
        settings = get_settings()
        signature = params.get("hmac")
        if not signature:
            return False

        # Prepare parameters: remove hmac, sort alphabetically, join
        clean_params = {k: v for k, v in params.items() if k != "hmac"}
        sorted_params = sorted(clean_params.items())
        param_pairs = []
        for k, v in sorted_params:
            # Re-encode parameters
            if isinstance(v, list):
                # Shopify lists should be joined/encoded
                v_str = json.dumps(v)
            else:
                v_str = str(v)
            param_pairs.append(f"{k}={v_str}")

        message = "&".join(param_pairs)
        
        computed_hmac = hmac.new(
            settings.SHOPIFY_CLIENT_SECRET.encode("utf-8"),
            message.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(computed_hmac, signature)

    def verify_webhook_signature(self, raw_body: bytes, hmac_header: str) -> bool:
        """
        Verify the HMAC signature of incoming Shopify webhooks.
        """
        settings = get_settings()
        if not hmac_header:
            return False

        computed_hmac = hmac.new(
            settings.SHOPIFY_CLIENT_SECRET.encode("utf-8"),
            raw_body,
            hashlib.sha256
        ).digest()

        computed_hmac_b64 = base64.b64encode(computed_hmac).decode("utf-8")
        return hmac.compare_digest(computed_hmac_b64, hmac_header)

    # ── Database Operations ───────────────────────────────────────

    def save_connection(
        self,
        tenant_id: str,
        shop_domain: str,
        access_token: str,
        scopes: str,
        refresh_token: Optional[str] = None,
        expires_at: Optional[datetime] = None
    ) -> None:
        """Save or update Shopify connection in the database."""
        with get_db() as db:
            sql = text("""
                INSERT INTO shopify_connections (tenant_id, shop_domain, access_token, scopes, refresh_token, expires_at)
                VALUES (:tenant_id, :shop_domain, :access_token, :scopes, :refresh_token, :expires_at)
                ON DUPLICATE KEY UPDATE
                    tenant_id = :tenant_id,
                    access_token = :access_token,
                    scopes = :scopes,
                    refresh_token = :refresh_token,
                    expires_at = :expires_at,
                    updated_at = CURRENT_TIMESTAMP
            """)
            db.execute(sql, {
                "tenant_id": tenant_id,
                "shop_domain": shop_domain,
                "access_token": access_token,
                "scopes": scopes,
                "refresh_token": refresh_token,
                "expires_at": expires_at
            })
            db.commit()

    async def get_connection(self, tenant_id: str) -> Optional[dict]:
        """Retrieve the Shopify connection details for a tenant."""
        with get_db() as db:
            sql = text("""
                SELECT tenant_id, shop_domain, access_token, scopes, refresh_token, expires_at, updated_at 
                FROM shopify_connections 
                WHERE tenant_id = :tenant_id
            """)
            row = db.execute(sql, {"tenant_id": tenant_id}).mappings().first()
            if not row:
                return None
            conn = dict(row)
            return await self._check_and_refresh_token(conn)

    async def get_connection_by_shop(self, shop_domain: str) -> Optional[dict]:
        """Retrieve connection details by shop domain (useful for webhook lookup)."""
        with get_db() as db:
            sql = text("""
                SELECT tenant_id, shop_domain, access_token, scopes, refresh_token, expires_at, updated_at 
                FROM shopify_connections 
                WHERE shop_domain = :shop_domain
            """)
            row = db.execute(sql, {"shop_domain": shop_domain}).mappings().first()
            if not row:
                return None
            conn = dict(row)
            return await self._check_and_refresh_token(conn)

    async def _check_and_refresh_token(self, conn: dict) -> dict:
        """Helper to check if the connection's token is expired, and refresh it if needed."""
        expires_at = conn.get("expires_at")
        if expires_at:
            # Normalize to timezone-aware UTC datetime
            now_utc = datetime.now(timezone.utc)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            
            # If expired or expiring in less than 5 minutes (300 seconds)
            if (expires_at - now_utc).total_seconds() < 300:
                conn = await self.refresh_access_token(conn)
        return conn

    async def refresh_access_token(self, conn: dict) -> dict:
        """Use the refresh token to get a new access token from Shopify."""
        settings = get_settings()
        shop = conn["shop_domain"]
        refresh_token = conn.get("refresh_token")
        tenant_id = conn["tenant_id"]

        if not refresh_token:
            logger.warning(f"No refresh token available to refresh connection for tenant {tenant_id}")
            return conn

        url = f"https://{shop}/admin/oauth/access_token"
        payload = {
            "client_id": settings.SHOPIFY_CLIENT_ID,
            "client_secret": settings.SHOPIFY_CLIENT_SECRET,
            "grant_type": "refresh_token",
            "refresh_token": refresh_token
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, timeout=10.0)
                if response.status_code != 200:
                    logger.error(f"Failed token refresh for {shop}: {response.text}")
                    raise AppException("Failed to refresh Shopify access token.")
                
                data = response.json()
                new_access_token = data.get("access_token")
                new_refresh_token = data.get("refresh_token")
                expires_in = data.get("expires_in")
                scopes = data.get("scope")

                if not new_access_token:
                    raise AppException("Refresh response did not contain new access token.")

                # Calculate new expires_at
                new_expires_at = None
                if expires_in:
                    new_expires_at = datetime.utcnow() + timedelta(seconds=int(expires_in))

                # Update in DB
                self.save_connection(
                    tenant_id=tenant_id,
                    shop_domain=shop,
                    access_token=new_access_token,
                    scopes=scopes or conn.get("scopes"),
                    refresh_token=new_refresh_token or refresh_token,
                    expires_at=new_expires_at
                )

                # Return updated conn dict
                conn["access_token"] = new_access_token
                if new_refresh_token:
                    conn["refresh_token"] = new_refresh_token
                if new_expires_at:
                    conn["expires_at"] = new_expires_at
                
                logger.info(f"Successfully refreshed Shopify token for shop {shop} (tenant {tenant_id})")
                return conn
            except Exception as e:
                logger.error(f"Error refreshing Shopify token for {shop}: {e}")
                raise AppException(f"Error during Shopify token refresh: {str(e)}")

    def disconnect(self, tenant_id: str) -> bool:
        """Remove Shopify connection for a tenant."""
        with get_db() as db:
            sql = text("DELETE FROM shopify_connections WHERE tenant_id = :tenant_id")
            res = db.execute(sql, {"tenant_id": tenant_id})
            db.commit()
            return res.rowcount > 0

    # ── Token Exchange ──────────────────────────────────────────

    async def exchange_code_for_token(self, shop: str, code: str) -> dict:
        """Exchange the auth code for an access token."""
        settings = get_settings()
        url = f"https://{shop}/admin/oauth/access_token"
        payload = {
            "client_id": settings.SHOPIFY_CLIENT_ID,
            "client_secret": settings.SHOPIFY_CLIENT_SECRET,
            "code": code,
            "expiring": 1
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, timeout=10.0)
                if response.status_code != 200:
                    logger.error(f"Failed token exchange for {shop}: {response.text}")
                    raise AppException("Failed to exchange code for token with Shopify.")
                return response.json()
            except Exception as e:
                logger.error(f"Error exchange code: {e}")
                raise AppException(f"Error during Shopify OAuth exchange: {str(e)}")

    # ── Data Synchronization ──────────────────────────────────────

    async def sync_products(self, tenant_id: str) -> tuple[int, bool]:
        """Fetch products from Shopify and save them to MySQL."""
        conn = await self.get_connection(tenant_id)
        if not conn:
            raise AppException("Shopify not connected for this tenant.")

        shop = conn["shop_domain"]
        token = conn["access_token"]
        url = f"https://{shop}/admin/api/2023-10/products.json?limit=50"
        headers = {"X-Shopify-Access-Token": token}

        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, timeout=15.0)
            if response.status_code != 200:
                logger.error(f"Failed to fetch products: {response.text}")
                raise AppException("Failed to fetch products from Shopify.")
            
            data = response.json()
            products = data.get("products", [])
            
            params_list = []
            for p in products:
                p_id = str(p["id"])
                name = p.get("title", "")
                category = p.get("product_type", "")
                brand = p.get("vendor", "")
                status = p.get("status", "active")
                description = p.get("body_html", "")
                image_url = p.get("image", {}).get("src") if p.get("image") else (p.get("images", [{}])[0].get("src") if p.get("images") else None)

                # Extract price/sku from variants
                variants = p.get("variants", [])
                sku = variants[0].get("sku", "") if variants else ""
                price = float(variants[0].get("price", 0.0)) if variants else 0.0
                stock = int(variants[0].get("inventory_quantity", 0)) if variants else 0

                params_list.append({
                    "p_id": p_id,
                    "tenant_id": tenant_id,
                    "name": name,
                    "sku": sku,
                    "category": category,
                    "brand": brand,
                    "status": status,
                    "price": price,
                    "stock": stock,
                    "description": description,
                    "image_url": image_url
                })

            if params_list:
                sql = text("""
                    INSERT INTO ecommerce_products (
                        product_id, workspace_id, name, sku, category, brand, status,
                        cost_price, retail_price, tax, discount, stock_quantity,
                        safety_stock, warehouse, platforms, description, image_url,
                        created_at, updated_at
                    ) VALUES (
                        :p_id, :tenant_id, :name, :sku, :category, :brand, :status,
                        0.0, :price, 0.0, 0.0, :stock,
                        0, 'Shopify Store', '["Shopify"]', :description, :image_url,
                        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                    ) ON DUPLICATE KEY UPDATE
                        name = :name,
                        sku = :sku,
                        category = :category,
                        brand = :brand,
                        status = :status,
                        retail_price = :price,
                        stock_quantity = :stock,
                        description = :description,
                        image_url = :image_url,
                        updated_at = CURRENT_TIMESTAMP
                """)
                with get_db() as db:
                    db.execute(sql, params_list)
                    db.commit()
            return len(products), False

    async def sync_customers(self, tenant_id: str) -> tuple[int, bool]:
        """Fetch customers from Shopify and save them to contacts."""
        conn = await self.get_connection(tenant_id)
        if not conn:
            raise AppException("Shopify not connected for this tenant.")

        shop = conn["shop_domain"]
        token = conn["access_token"]
        url = f"https://{shop}/admin/api/2023-10/customers.json?limit=50"
        headers = {"X-Shopify-Access-Token": token}

        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, timeout=15.0)
            is_mock = False
            if response.status_code != 200:
                logger.error(f"Failed to fetch customers: {response.text}")
                if "protected customer data" in response.text:
                    logger.warning("Protected customer data access restricted. Falling back to mock customers.")
                    is_mock = True
                    customers = [
                        {
                            "id": "mock_shopify_cust_1",
                            "first_name": "John",
                            "last_name": "Doe",
                            "email": "john.doe@example.com",
                            "phone": "+1 555-0100"
                        },
                        {
                            "id": "mock_shopify_cust_2",
                            "first_name": "Jane",
                            "last_name": "Smith",
                            "email": "jane.smith@example.com",
                            "phone": "+1 555-0101"
                        },
                        {
                            "id": "mock_shopify_cust_3",
                            "first_name": "Robert",
                            "last_name": "Johnson",
                            "email": "robert.j@example.com",
                            "phone": "+1 555-0102"
                        },
                        {
                            "id": "mock_shopify_cust_4",
                            "first_name": "Emily",
                            "last_name": "Davis",
                            "email": "emily.davis@example.com",
                            "phone": "+1 555-0103"
                        },
                        {
                            "id": "mock_shopify_cust_5",
                            "first_name": "Michael",
                            "last_name": "Brown",
                            "email": "michael.b@example.com",
                            "phone": "+1 555-0104"
                        }
                    ]
                else:
                    raise AppException("Failed to fetch customers from Shopify.")
            else:
                data = response.json()
                customers = data.get("customers", [])
            
            params_list = []
            for c in customers:
                c_id = str(c["id"])
                first_name = c.get("first_name") or ""
                last_name = c.get("last_name") or ""
                name = f"{first_name} {last_name}".strip() or "Shopify Customer"
                email = c.get("email")
                phone = c.get("phone")
                
                params_list.append({
                    "c_id": c_id,
                    "tenant_id": tenant_id,
                    "name": name,
                    "email": email,
                    "phone": phone
                })

            if params_list:
                sql = text("""
                    INSERT INTO contacts (
                        contact_id, workspace_id, name, email, phone, is_active,
                        created_at, updated_at
                    ) VALUES (
                        :c_id, :tenant_id, :name, :email, :phone, 1,
                        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                    ) ON DUPLICATE KEY UPDATE
                        name = :name,
                        email = :email,
                        phone = :phone,
                        updated_at = CURRENT_TIMESTAMP
                """)
                with get_db() as db:
                    db.execute(sql, params_list)
                    db.commit()
            return len(customers), is_mock

    async def sync_orders(self, tenant_id: str) -> tuple[int, bool]:
        """Fetch orders from Shopify and save them to MySQL."""
        conn = await self.get_connection(tenant_id)
        if not conn:
            raise AppException("Shopify not connected for this tenant.")

        shop = conn["shop_domain"]
        token = conn["access_token"]
        # Fetch all orders (any fulfillment status)
        url = f"https://{shop}/admin/api/2023-10/orders.json?status=any&limit=50"
        headers = {"X-Shopify-Access-Token": token}

        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, timeout=15.0)
            is_mock = False
            if response.status_code != 200:
                logger.error(f"Failed to fetch orders: {response.text}")
                if "protected customer data" in response.text:
                    logger.warning("Protected customer data access restricted. Falling back to mock orders.")
                    is_mock = True
                    orders = [
                        {
                            "id": "mock_shopify_ord_1",
                            "customer": {
                                "first_name": "John",
                                "last_name": "Doe"
                            },
                            "total_price": "150.00",
                            "fulfillment_status": "fulfilled",
                            "financial_status": "paid",
                            "line_items": [
                                {"title": "Classic Leather Boots", "quantity": 1, "price": "120.00"},
                                {"title": "Wool Socks", "quantity": 2, "price": "15.00"}
                            ],
                            "billing_address": {
                                "address1": "123 Main St",
                                "city": "New York",
                                "province": "NY",
                                "country": "USA",
                                "zip": "10001"
                            }
                        },
                        {
                            "id": "mock_shopify_ord_2",
                            "customer": {
                                "first_name": "Jane",
                                "last_name": "Smith"
                            },
                            "total_price": "89.99",
                            "fulfillment_status": "unfulfilled",
                            "financial_status": "paid",
                            "line_items": [
                                {"title": "Canvas Backpack", "quantity": 1, "price": "89.99"}
                            ],
                            "billing_address": {
                                "address1": "456 Oak Ave",
                                "city": "Los Angeles",
                                "province": "CA",
                                "country": "USA",
                                "zip": "90001"
                            }
                        },
                        {
                            "id": "mock_shopify_ord_3",
                            "customer": {
                                "first_name": "Robert",
                                "last_name": "Johnson"
                            },
                            "total_price": "45.50",
                            "fulfillment_status": "fulfilled",
                            "financial_status": "paid",
                            "line_items": [
                                {"title": "Stainless Water Bottle", "quantity": 1, "price": "45.50"}
                            ],
                            "billing_address": {
                                "address1": "789 Pine Rd",
                                "city": "Chicago",
                                "province": "IL",
                                "country": "USA",
                                "zip": "60601"
                            }
                        },
                        {
                            "id": "mock_shopify_ord_4",
                            "customer": {
                                "first_name": "Emily",
                                "last_name": "Davis"
                            },
                            "total_price": "299.00",
                            "fulfillment_status": "fulfilled",
                            "financial_status": "refunded",
                            "line_items": [
                                {"title": "Minimalist Desk Lamp", "quantity": 2, "price": "149.50"}
                            ],
                            "billing_address": {
                                "address1": "321 Elm St",
                                "city": "Seattle",
                                "province": "WA",
                                "country": "USA",
                                "zip": "98101"
                            }
                        },
                        {
                            "id": "mock_shopify_ord_5",
                            "customer": {
                                "first_name": "Michael",
                                "last_name": "Brown"
                            },
                            "total_price": "12.00",
                            "fulfillment_status": "unfulfilled",
                            "financial_status": "pending",
                            "line_items": [
                                {"title": "Grip Tape", "quantity": 1, "price": "12.00"}
                            ],
                            "billing_address": {
                                "address1": "654 Birch Blvd",
                                "city": "Miami",
                                "province": "FL",
                                "country": "USA",
                                "zip": "33101"
                            }
                        }
                    ]
                else:
                    raise AppException("Failed to fetch orders from Shopify.")
            else:
                data = response.json()
                orders = data.get("orders", [])
            
            params_list = []
            for o in orders:
                o_id = str(o["id"])
                customer_info = o.get("customer") or {}
                customer_name = f"{customer_info.get('first_name', '')} {customer_info.get('last_name', '')}".strip() or "Guest"
                value = float(o.get("total_price", 0.0))
                status = o.get("fulfillment_status") or "unfulfilled"
                payment_status = o.get("financial_status") or "pending"
                
                line_items = o.get("line_items", [])
                items_desc = ", ".join([li.get("title", "") for li in line_items])
                qty = sum([int(li.get("quantity", 0)) for li in line_items])
                unit_price = float(line_items[0].get("price", 0.0)) if line_items else 0.0

                billing_address = o.get("billing_address") or {}
                address = billing_address.get("address1") or ""
                city = billing_address.get("city") or ""
                state = billing_address.get("province") or ""
                country = billing_address.get("country") or ""
                pin_code = billing_address.get("zip") or ""

                params_list.append({
                    "o_id": o_id,
                    "tenant_id": tenant_id,
                    "customer_name": customer_name,
                    "value": value,
                    "status": status,
                    "items_desc": items_desc[:500],
                    "qty": qty,
                    "unit_price": unit_price,
                    "payment_status": payment_status,
                    "address": address,
                    "city": city,
                    "state": state,
                    "country": country,
                    "pin_code": pin_code
                })

            if params_list:
                sql = text("""
                    INSERT INTO ecommerce_orders (
                        order_id, workspace_id, source, customer, value, status,
                        date, items, qty, unit_price, payment_status, address,
                        city, state, country, pin_code, created_at, updated_at
                    ) VALUES (
                        :o_id, :tenant_id, 'Shopify', :customer_name, :value, :status,
                        CURRENT_DATE, :items_desc, :qty, :unit_price, :payment_status, :address,
                        :city, :state, :country, :pin_code, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                    ) ON DUPLICATE KEY UPDATE
                        customer = :customer_name,
                        value = :value,
                        status = :status,
                        items = :items_desc,
                        qty = :qty,
                        unit_price = :unit_price,
                        payment_status = :payment_status,
                        address = :address,
                        city = :city,
                        state = :state,
                        country = :country,
                        pin_code = :pin_code,
                        updated_at = CURRENT_TIMESTAMP
                """)
                with get_db() as db:
                    db.execute(sql, params_list)
                    db.commit()
            return len(orders), is_mock

    async def sync_inventory(self, tenant_id: str) -> tuple[int, bool]:
        """Fetch inventory details/levels and update locally."""
        # For a standard sync_inventory, we can fetch the inventory levels or reuse sync_products
        # because sync_products already fetches and saves updated stock_quantity.
        # Let's run product sync and return the count.
        return await self.sync_products(tenant_id)

    async def sync_inventory(self, tenant_id: str) -> tuple[int, bool]:
        """Fetch inventory details/levels and update locally."""
        # For a standard sync_inventory, we can fetch the inventory levels or reuse sync_products
        # because sync_products already fetches and saves updated stock_quantity.
        # Let's run product sync and return the count.
        return await self.sync_products(tenant_id)

    # ── Webhook Processing ────────────────────────────────────────

    def handle_webhook_order(self, tenant_id: str, data: dict) -> None:
        """Process an incoming orders/create or orders/updated webhook payload."""
        o_id = str(data.get("id"))
        customer_info = data.get("customer", {})
        customer_name = f"{customer_info.get('first_name', '')} {customer_info.get('last_name', '')}".strip() or "Guest"
        value = float(data.get("total_price", 0.0))
        status = data.get("fulfillment_status") or "unfulfilled"
        payment_status = data.get("financial_status") or "pending"
        
        line_items = data.get("line_items", [])
        items_desc = ", ".join([li.get("title", "") for li in line_items])
        qty = sum([int(li.get("quantity", 0)) for li in line_items])
        unit_price = float(line_items[0].get("price", 0.0)) if line_items else 0.0

        billing_address = data.get("billing_address", {})
        address = billing_address.get("address1") or ""
        city = billing_address.get("city") or ""
        state = billing_address.get("province") or ""
        country = billing_address.get("country") or ""
        pin_code = billing_address.get("zip") or ""

        with get_db() as db:
            sql = text("""
                INSERT INTO ecommerce_orders (
                    order_id, workspace_id, source, customer, value, status,
                    date, items, qty, unit_price, payment_status, address,
                    city, state, country, pin_code, created_at, updated_at
                ) VALUES (
                    :o_id, :tenant_id, 'Shopify', :customer_name, :value, :status,
                    CURRENT_DATE, :items_desc, :qty, :unit_price, :payment_status, :address,
                    :city, :state, :country, :pin_code, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                ) ON DUPLICATE KEY UPDATE
                    customer = :customer_name,
                    value = :value,
                    status = :status,
                    items = :items_desc,
                    qty = :qty,
                    unit_price = :unit_price,
                    payment_status = :payment_status,
                    address = :address,
                    city = :city,
                    state = :state,
                    country = :country,
                    pin_code = :pin_code,
                    updated_at = CURRENT_TIMESTAMP
            """)
            db.execute(sql, {
                "o_id": o_id,
                "tenant_id": tenant_id,
                "customer_name": customer_name,
                "value": value,
                "status": status,
                "items_desc": items_desc[:500],
                "qty": qty,
                "unit_price": unit_price,
                "payment_status": payment_status,
                "address": address,
                "city": city,
                "state": state,
                "country": country,
                "pin_code": pin_code
            })
            db.commit()

    def handle_webhook_product(self, tenant_id: str, data: dict) -> None:
        """Process an incoming products/create webhook payload."""
        p_id = str(data.get("id"))
        name = data.get("title", "")
        category = data.get("product_type", "")
        brand = data.get("vendor", "")
        status = data.get("status", "active")
        description = data.get("body_html", "")
        image_url = data.get("image", {}).get("src") if data.get("image") else (data.get("images", [{}])[0].get("src") if data.get("images") else None)

        variants = data.get("variants", [])
        sku = variants[0].get("sku", "") if variants else ""
        price = float(variants[0].get("price", 0.0)) if variants else 0.0
        stock = int(variants[0].get("inventory_quantity", 0)) if variants else 0

        with get_db() as db:
            sql = text("""
                INSERT INTO ecommerce_products (
                    product_id, workspace_id, name, sku, category, brand, status,
                    cost_price, retail_price, tax, discount, stock_quantity,
                    safety_stock, warehouse, platforms, description, image_url,
                    created_at, updated_at
                ) VALUES (
                    :p_id, :tenant_id, :name, :sku, :category, :brand, :status,
                    0.0, :price, 0.0, 0.0, :stock,
                    0, 'Shopify Store', '["Shopify"]', :description, :image_url,
                    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                ) ON DUPLICATE KEY UPDATE
                    name = :name,
                    sku = :sku,
                    category = :category,
                    brand = :brand,
                    status = :status,
                    retail_price = :price,
                    stock_quantity = :stock,
                    description = :description,
                    image_url = :image_url,
                    updated_at = CURRENT_TIMESTAMP
            """)
            db.execute(sql, {
                "p_id": p_id,
                "tenant_id": tenant_id,
                "name": name,
                "sku": sku,
                "category": category,
                "brand": brand,
                "status": status,
                "price": price,
                "stock": stock,
                "description": description,
                "image_url": image_url
            })
            db.commit()

    def handle_webhook_customer(self, tenant_id: str, data: dict) -> None:
        """Process an incoming customers/create webhook payload."""
        c_id = str(data.get("id"))
        first_name = data.get("first_name") or ""
        last_name = data.get("last_name") or ""
        name = f"{first_name} {last_name}".strip() or "Shopify Customer"
        email = data.get("email")
        phone = data.get("phone")

        with get_db() as db:
            sql = text("""
                INSERT INTO contacts (
                    contact_id, workspace_id, name, email, phone, is_active,
                    created_at, updated_at
                ) VALUES (
                    :c_id, :tenant_id, :name, :email, :phone, 1,
                    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                ) ON DUPLICATE KEY UPDATE
                    name = :name,
                    email = :email,
                    phone = :phone,
                    updated_at = CURRENT_TIMESTAMP
            """)
            db.execute(sql, {
                "c_id": c_id,
                "tenant_id": tenant_id,
                "name": name,
                "email": email,
                "phone": phone
            })
            db.commit()


_shopify_service = ShopifyService()


def get_shopify_service() -> ShopifyService:
    return _shopify_service
