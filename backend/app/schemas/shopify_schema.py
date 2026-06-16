"""
Shopify Integration API Schemas
================================
Pydantic models for validation and response formatting.
"""

from typing import Optional
from pydantic import BaseModel, Field


class ShopifyConnectRequest(BaseModel):
    """Payload to start Shopify OAuth flow."""
    shop: str = Field(..., description="The shop domain, e.g. mystore.myshopify.com")


class ShopifyConnectionStatus(BaseModel):
    """Shopify connection status response."""
    connected: bool
    shop: Optional[str] = None
    last_sync: Optional[str] = None
