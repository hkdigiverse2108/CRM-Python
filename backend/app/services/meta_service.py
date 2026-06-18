"""
Meta OAuth & Graph API Service
===============================
Handles the complete Meta (Facebook) OAuth lifecycle:
  - Generating the OAuth login URL
  - Exchanging authorization codes for access tokens
  - Extending short-lived tokens to long-lived (60-day) tokens
  - Fetching user info, Facebook Pages, Ad Accounts, WABA, Instagram accounts
  - Persisting/removing integration data in MySQL
"""

import uuid
import secrets
import httpx
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy import text

from backend.app.core.config import get_settings
from backend.app.core.database import get_db
from backend.app.utils.logger import get_logger
from backend.app.utils.exceptions import AppException

logger = get_logger("meta_service")

META_SCOPES = [
    "public_profile",
    "email",
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_metadata",
    "ads_management",
    "ads_read",
    "business_management",
    "whatsapp_business_management",
    "whatsapp_business_messaging"
]


class MetaService:
    """Orchestrates Meta platform OAuth and Graph API interactions."""

    def __init__(self):
        pass

    @property
    def graph_base(self) -> str:
        settings = get_settings()
        return f"https://graph.facebook.com/{settings.META_GRAPH_API_VERSION}"

    # ── OAuth URL Generation ─────────────────────────────────────

    def generate_oauth_url(self, workspace_id: str, user_id: str = "default_user") -> dict:
        """
        Build the Meta OAuth authorization URL.
        Returns the URL and a CSRF state token.
        """
        state = f"{workspace_id}:{user_id}:{secrets.token_urlsafe(16)}"
        scope_str = ",".join(META_SCOPES)

        settings = get_settings()
        
        # If no custom Meta App ID is configured, fall back to Simulated Sandbox Demo mode
        # for instant 1-click non-technical connection experience
        is_sandbox = not settings.META_APP_ID or settings.META_APP_ID == "YOUR_META_APP_ID"
        
        if is_sandbox:
            sandbox_callback_url = f"{settings.META_REDIRECT_URI}?code=mock_auth_code_sandbox&state={state}"
            return {
                "oauth_url": sandbox_callback_url,
                "state": state,
                "sandbox": True,
            }

        redirect_uri = settings.META_REDIRECT_URI
        oauth_url = (
            f"https://www.facebook.com/{settings.META_GRAPH_API_VERSION}/dialog/oauth?"
            f"client_id={settings.META_APP_ID}"
            f"&redirect_uri={redirect_uri}"
            f"&state={state}"
            f"&scope={scope_str}"
            f"&response_type=code"
        )

        return {
            "oauth_url": oauth_url,
            "state": state,
            "sandbox": False,
        }

    # ── Token Exchange ───────────────────────────────────────────

    async def exchange_code_for_token(self, code: str) -> dict:
        """
        Exchange the authorization code for a short-lived access token,
        then extend it to a long-lived (60-day) token.
        """
        if code == "mock_auth_code_sandbox":
            return {
                "access_token": "mock_sandbox_access_token_xyz123abc",
                "expires_in": 5184000,
            }
        # Step 1: Exchange code for short-lived token
        settings = get_settings()
        redirect_uri = settings.META_REDIRECT_URI
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                f"https://graph.facebook.com/{settings.META_GRAPH_API_VERSION}/oauth/access_token",
                params={
                    "client_id": settings.META_APP_ID,
                    "client_secret": settings.META_APP_SECRET,
                    "redirect_uri": redirect_uri,
                    "code": code,
                },
            )

        if resp.status_code != 200:
            logger.error(f"Token exchange failed: {resp.text}")
            raise AppException(
                message="Failed to exchange authorization code with Meta. Please try again.",
                status_code=400,
            )

        data = resp.json()
        short_token = data.get("access_token")
        if not short_token:
            raise AppException(message="No access token returned by Meta.", status_code=400)

        # Step 2: Extend to long-lived token
        long_lived = await self._extend_token(short_token)
        return long_lived

    async def _extend_token(self, short_token: str) -> dict:
        """Exchange a short-lived token for a long-lived (60-day) token."""
        settings = get_settings()
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                f"{self.graph_base}/oauth/access_token",
                params={
                    "grant_type": "fb_exchange_token",
                    "client_id": settings.META_APP_ID,
                    "client_secret": settings.META_APP_SECRET,
                    "fb_exchange_token": short_token,
                },
            )

        if resp.status_code != 200:
            logger.warning(f"Token extension failed, using short-lived token: {resp.text}")
            return {"access_token": short_token, "expires_in": 3600}

        data = resp.json()
        return {
            "access_token": data.get("access_token", short_token),
            "expires_in": data.get("expires_in", 5184000),  # Default 60 days
        }

    # ── Graph API Fetchers ───────────────────────────────────────

    async def fetch_user_info(self, token: str) -> dict:
        """Fetch the authenticated user's Meta profile."""
        if token == "mock_sandbox_access_token_xyz123abc":
            return {"id": "mock_user_123", "name": "Digiverse Admin", "email": "princegajera0506@gmail.com"}
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{self.graph_base}/me",
                params={"fields": "id,name,email", "access_token": token},
            )
        if resp.status_code != 200:
            raise AppException(message="Failed to fetch Meta user info.", status_code=400)
        return resp.json()

    async def fetch_pages(self, token: str) -> list[dict]:
        """Fetch all Facebook Pages the user manages."""
        if token == "mock_sandbox_access_token_xyz123abc":
            return [
                {"id": "mock_page_1", "name": "Digiverse Corp", "category": "Agency", "access_token": "mock_page_token_1", "followers_count": 14205},
                {"id": "mock_page_2", "name": "AIO Retail Shop", "category": "Retail", "access_token": "mock_page_token_2", "followers_count": 892}
            ]
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{self.graph_base}/me/accounts",
                params={
                    "fields": "id,name,category,access_token,followers_count",
                    "access_token": token,
                    "limit": 100,
                },
            )
        if resp.status_code != 200:
            logger.warning(f"Failed to fetch pages: {resp.text}")
            return []
        return resp.json().get("data", [])

    async def fetch_ad_accounts(self, token: str) -> list[dict]:
        """Fetch all Meta Ad Accounts the user has access to."""
        if token == "mock_sandbox_access_token_xyz123abc":
            return [
                {"id": "act_88201948", "name": "Digiverse Brand Campaign AD", "currency": "INR", "timezone_name": "Asia/Kolkata", "account_status": 1, "business": {"id": "biz_88201948", "name": "Digiverse Business Portfolio"}},
                {"id": "act_22091842", "name": "AIO Retargeting AD", "currency": "USD", "timezone_name": "America/New_York", "account_status": 1, "business": {"id": "biz_999999", "name": "Other Business Portfolio"}}
            ]
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{self.graph_base}/me/adaccounts",
                params={
                    "fields": "id,name,account_id,currency,timezone_name,account_status,business",
                    "access_token": token,
                    "limit": 100,
                },
            )
        if resp.status_code != 200:
            logger.warning(f"Failed to fetch ad accounts: {resp.text}")
            return []
        return resp.json().get("data", [])

    async def fetch_whatsapp_accounts(self, token: str, business_id: str) -> list[dict]:
        """Fetch WhatsApp Business Accounts linked to a business."""
        if token == "mock_sandbox_access_token_xyz123abc":
            return [
                {"id": "waba_991823749", "name": "Digiverse WhatsApp API Account", "status": "APPROVED"}
            ]
        if not business_id:
            return []
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{self.graph_base}/{business_id}/owned_whatsapp_business_accounts",
                params={
                    "fields": "id,name,status",
                    "access_token": token,
                    "limit": 50,
                },
            )
        if resp.status_code != 200:
            logger.warning(f"Failed to fetch WABA: {resp.text}")
            return []
        return resp.json().get("data", [])

    async def fetch_waba_phone_numbers(self, token: str, waba_id: str) -> list[dict]:
        """Fetch registered phone numbers for a WABA."""
        if token == "mock_sandbox_access_token_xyz123abc":
            return [{
                "id": "phone_number_id_991",
                "display_phone_number": "+1 555-019-2834",
                "verified_name": "Digiverse Corp",
                "quality_rating": "High",
                "status": "APPROVED"
            }]
        if not waba_id:
            return []
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{self.graph_base}/{waba_id}/phone_numbers",
                params={
                    "fields": "id,display_phone_number,verified_name,quality_rating,status",
                    "access_token": token,
                    "limit": 100,
                },
            )
        if resp.status_code != 200:
            logger.warning(f"Failed to fetch phone numbers for WABA {waba_id}: {resp.text}")
            return []
        return resp.json().get("data", [])

    async def fetch_instagram_accounts(self, token: str, page_id: str) -> Optional[dict]:
        """Fetch the Instagram Business Account linked to a Facebook Page."""
        if token == "mock_sandbox_access_token_xyz123abc" or token.startswith("mock_page_token_"):
            if page_id == "mock_page_1":
                return {"id": "ig_9920194", "username": "digiverse_corp", "followers_count": 8920, "profile_picture_url": "https://api.dicebear.com/7.x/identicon/svg?seed=digiverse"}
            return None
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{self.graph_base}/{page_id}",
                params={
                    "fields": "instagram_business_account{id,username,followers_count,profile_picture_url}",
                    "access_token": token,
                },
            )
        if resp.status_code != 200:
            return None
        data = resp.json()
        return data.get("instagram_business_account")

    async def fetch_businesses(self, token: str) -> list[dict]:
        """Fetch all businesses the user manages."""
        if token == "mock_sandbox_access_token_xyz123abc":
            return [
                {"id": "biz_88201948", "name": "Digiverse Business Portfolio"}
            ]
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{self.graph_base}/me/businesses",
                params={
                    "fields": "id,name",
                    "access_token": token,
                    "limit": 50,
                },
            )
        if resp.status_code != 200:
            logger.warning(f"Failed to fetch businesses: {resp.text}")
            return []
        return resp.json().get("data", [])

    async def fetch_lead_forms(self, token: str, page_id: str) -> list[dict]:
        """Fetch lead generation forms associated with a Facebook Page."""
        if token == "mock_sandbox_access_token_xyz123abc" or token.startswith("mock_page_token_"):
            if page_id == "mock_page_1":
                return [
                    {"id": "form_1", "name": "Digiverse Enterprise Lead Form", "status": "ACTIVE"},
                    {"id": "form_2", "name": "WhatsApp Connect Request Form", "status": "ACTIVE"}
                ]
            return []
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{self.graph_base}/{page_id}/leadgen_forms",
                params={
                    "fields": "id,name,status",
                    "access_token": token,
                    "limit": 100,
                },
            )
        if resp.status_code != 200:
            logger.warning(f"Failed to fetch lead forms for page {page_id}: {resp.text}")
            return []
        return resp.json().get("data", [])

    # ── Database Persistence ─────────────────────────────────────

    def save_integration(
        self,
        workspace_id: str,
        user_id: str,
        meta_user_id: str,
        business_id: str,
        business_name: str,
        access_token: str,
        token_expiry_seconds: int,
        scopes: str,
        pages: list[dict],
        ad_accounts: list[dict],
        whatsapp_accounts: list[dict],
        instagram_accounts: list[dict],
        lead_forms: list[dict],
        whatsapp_phone_numbers: list[dict] = None,
    ) -> str:
        """Persist the Meta integration and all discovered assets to MySQL."""
        integration_id = str(uuid.uuid4())
        token_expiry = datetime.utcnow() + timedelta(seconds=token_expiry_seconds)

        with get_db() as db:
            # Upsert main integration record
            db.execute(
                text("""
                INSERT INTO meta_integrations 
                    (integration_id, workspace_id, user_id, meta_user_id, business_id, 
                     business_name, access_token, token_expiry, scopes, status)
                VALUES (:int_id, :ws_id, :u_id, :meta_uid, :biz_id, 
                        :biz_name, :token, :expiry, :scopes, 'Connected')
                ON DUPLICATE KEY UPDATE
                    access_token = VALUES(access_token),
                    token_expiry = VALUES(token_expiry),
                    scopes = VALUES(scopes),
                    status = 'Connected',
                    updated_at = CURRENT_TIMESTAMP
                """),
                {
                    "int_id": integration_id,
                    "ws_id": workspace_id,
                    "u_id": user_id,
                    "meta_uid": meta_user_id,
                    "biz_id": business_id or "",
                    "biz_name": business_name or "",
                    "token": access_token,
                    "expiry": token_expiry,
                    "scopes": scopes,
                },
            )

            # Save Facebook Pages
            for page in pages:
                db.execute(
                    text("""
                    INSERT IGNORE INTO facebook_pages 
                        (page_id, workspace_id, integration_id, page_name, page_access_token, 
                         category, followers_count, status)
                    VALUES (:pid, :ws_id, :int_id, :name, :token, :cat, :followers, 'Connected')
                    """),
                    {
                        "pid": page.get("id"),
                        "ws_id": workspace_id,
                        "int_id": integration_id,
                        "name": page.get("name", ""),
                        "token": page.get("access_token", ""),
                        "cat": page.get("category", ""),
                        "followers": page.get("followers_count", 0),
                    },
                )

            # Save Lead Forms
            for form in lead_forms:
                db.execute(
                    text("""
                    INSERT IGNORE INTO facebook_lead_forms
                        (form_id, workspace_id, page_id, form_name, status)
                    VALUES (:fid, :ws_id, :pid, :name, :status)
                    """),
                    {
                        "fid": form.get("id"),
                        "ws_id": workspace_id,
                        "pid": form.get("page_id", ""),
                        "name": form.get("name", ""),
                        "status": form.get("status", "Connected"),
                    },
                )

            # Save Ad Accounts
            for ad in ad_accounts:
                ad_biz = ad.get("business", {})
                ad_biz_id = ad_biz.get("id") or business_id or ""
                db.execute(
                    text("""
                    INSERT IGNORE INTO meta_ad_accounts
                        (ad_account_id, workspace_id, business_id, account_name, 
                         currency, timezone, status)
                    VALUES (:aid, :ws_id, :biz_id, :name, :currency, :tz, 'Connected')
                    ON DUPLICATE KEY UPDATE
                        business_id = VALUES(business_id),
                        account_name = VALUES(account_name),
                        currency = VALUES(currency),
                        timezone = VALUES(timezone),
                        status = 'Connected'
                    """),
                    {
                        "aid": ad.get("id", ad.get("account_id", "")),
                        "ws_id": workspace_id,
                        "biz_id": ad_biz_id,
                        "name": ad.get("name", ""),
                        "currency": ad.get("currency", "USD"),
                        "tz": ad.get("timezone_name", "UTC"),
                    },
                )

            # Save WhatsApp Business Accounts
            for waba in whatsapp_accounts:
                db.execute(
                    text("""
                    INSERT IGNORE INTO whatsapp_business_accounts
                        (waba_id, workspace_id, business_id, account_name, status)
                    VALUES (:wid, :ws_id, :biz_id, :name, 'Connected')
                    """),
                    {
                        "wid": waba.get("id"),
                        "ws_id": workspace_id,
                        "biz_id": business_id or "",
                        "name": waba.get("name", ""),
                    },
                )

            # Save WhatsApp Phone Numbers
            if whatsapp_phone_numbers:
                for phone in whatsapp_phone_numbers:
                    db.execute(
                        text("""
                        INSERT INTO whatsapp_phone_numbers
                            (phone_number_id, workspace_id, waba_id, display_name, 
                             verified_name, phone_number, quality_rating, status)
                        VALUES (:pid, :ws_id, :wid, :display_name, :verified_name, :num, :quality, :status)
                        ON DUPLICATE KEY UPDATE
                            display_name = VALUES(display_name),
                            verified_name = VALUES(verified_name),
                            phone_number = VALUES(phone_number),
                            quality_rating = VALUES(quality_rating),
                            status = VALUES(status)
                        """),
                        {
                            "pid": phone.get("id"),
                            "ws_id": workspace_id,
                            "wid": phone.get("waba_id"),
                            "display_name": phone.get("display_phone_number", ""),
                            "verified_name": phone.get("verified_name") or "",
                            "num": phone.get("display_phone_number", ""),
                            "quality": phone.get("quality_rating", "High"),
                            "status": phone.get("status", "Connected"),
                        }
                    )

                # Auto-link if exactly 1 phone number exists
                if len(whatsapp_phone_numbers) == 1:
                    phone = whatsapp_phone_numbers[0]
                    exist_check = db.execute(
                        text("SELECT id FROM whatsapp_accounts WHERE tenant_id = :tenant_id"),
                        {"tenant_id": workspace_id}
                    ).scalar()
                    
                    waba_name = "WhatsApp Business Account"
                    for waba in whatsapp_accounts:
                        if waba.get("id") == phone.get("waba_id"):
                            waba_name = waba.get("name", waba_name)
                            break
                    
                    if exist_check:
                        db.execute(
                            text("""
                            UPDATE whatsapp_accounts 
                            SET business_name = :biz_name, waba_id = :waba_id, phone_number_id = :phone_id, 
                                access_token = :token, display_phone_number = :phone_num, status = 'Connected'
                            WHERE tenant_id = :tenant_id
                            """),
                            {
                                "biz_name": waba_name,
                                "waba_id": phone.get("waba_id"),
                                "phone_id": phone.get("id"),
                                "token": access_token,
                                "phone_num": phone.get("display_phone_number", ""),
                                "tenant_id": workspace_id
                            }
                        )
                    else:
                        db.execute(
                            text("""
                            INSERT INTO whatsapp_accounts (id, tenant_id, business_name, waba_id, phone_number_id, access_token, display_phone_number, status)
                            VALUES (:id, :tenant_id, :biz_name, :waba_id, :phone_id, :token, :phone_num, 'Connected')
                            """),
                            {
                                "id": str(uuid.uuid4()),
                                "tenant_id": workspace_id,
                                "biz_name": waba_name,
                                "waba_id": phone.get("waba_id"),
                                "phone_id": phone.get("id"),
                                "token": access_token,
                                "phone_num": phone.get("display_phone_number", "")
                            }
                        )
            db.commit()

            # Save Instagram Business Accounts
            for ig in instagram_accounts:
                if ig:
                    db.execute(
                        text("""
                        INSERT IGNORE INTO instagram_business_accounts
                            (instagram_id, workspace_id, page_id, username, 
                             followers, profile_picture, status)
                        VALUES (:ig_id, :ws_id, :pid, :username, :followers, :pic, 'Connected')
                        """),
                        {
                            "ig_id": ig.get("id"),
                            "ws_id": workspace_id,
                            "pid": ig.get("page_id", ""),
                            "username": ig.get("username", ""),
                            "followers": ig.get("followers_count", 0),
                            "pic": ig.get("profile_picture_url", ""),
                        },
                    )

        return integration_id

    def get_status(self, workspace_id: str) -> dict:
        """Get the current Meta integration status for a workspace."""
        with get_db() as db:
            # Main integration
            result = db.execute(
                text("""
                SELECT integration_id, meta_user_id, business_id, business_name,
                       token_expiry, scopes, status, connected_at, updated_at
                FROM meta_integrations
                WHERE workspace_id = :ws_id AND status = 'Connected'
                ORDER BY updated_at DESC LIMIT 1
                """),
                {"ws_id": workspace_id},
            )
            row = result.fetchone()

            if not row:
                settings = get_settings()
                return {
                    "connected": False,
                    "app_id_configured": bool(settings.META_APP_ID and settings.META_APP_ID != "YOUR_META_APP_ID"),
                    "app_secret_configured": bool(settings.META_APP_SECRET and settings.META_APP_SECRET != "YOUR_META_APP_SECRET"),
                    "meta_app_id": settings.META_APP_ID if settings.META_APP_ID != "YOUR_META_APP_ID" else "",
                    "platforms": {
                        "whatsapp": {"connected": False, "assets": []},
                        "facebook_pages": {"connected": False, "assets": []},
                        "facebook_lead_forms": {"connected": False, "assets": []},
                        "instagram": {"connected": False, "assets": []},
                        "meta_ads": {"connected": False, "assets": []},
                    },
                }

            integration_id = row[0]
            token_expiry = row[4]
            token_valid = token_expiry and token_expiry > datetime.utcnow()

            # Fetch pages
            pages_result = db.execute(
                text("SELECT page_id, page_name, category, followers_count, status FROM facebook_pages WHERE workspace_id = :ws_id"),
                {"ws_id": workspace_id},
            )
            pages = [
                {"id": r[0], "name": r[1], "category": r[2], "followers": r[3], "status": r[4]}
                for r in pages_result.fetchall()
            ]

            # Fetch lead forms
            forms_result = db.execute(
                text("SELECT form_id, page_id, form_name, status FROM facebook_lead_forms WHERE workspace_id = :ws_id"),
                {"ws_id": workspace_id},
            )
            lead_forms = [
                {"id": r[0], "page_id": r[1], "name": r[2], "status": r[3]}
                for r in forms_result.fetchall()
            ]

            # Fetch ad accounts
            ads_result = db.execute(
                text("SELECT ad_account_id, account_name, currency, timezone, status, business_id FROM meta_ad_accounts WHERE workspace_id = :ws_id"),
                {"ws_id": workspace_id},
            )
            ad_accounts = [
                {"id": r[0], "name": r[1], "currency": r[2], "timezone": r[3], "status": r[4], "business_id": r[5]}
                for r in ads_result.fetchall()
            ]

            # Fetch WABA
            waba_result = db.execute(
                text("SELECT waba_id, account_name, status, business_id FROM whatsapp_business_accounts WHERE workspace_id = :ws_id"),
                {"ws_id": workspace_id},
            )
            waba_accounts = [
                {"id": r[0], "name": r[1], "status": r[2], "business_id": r[3]}
                for r in waba_result.fetchall()
            ]

            # Fetch Phone Numbers
            phone_result = db.execute(
                text("SELECT phone_number_id, waba_id, display_name, phone_number, status FROM whatsapp_phone_numbers WHERE workspace_id = :ws_id"),
                {"ws_id": workspace_id}
            )
            phone_numbers = [
                {
                    "id": r[0],
                    "waba_id": r[1],
                    "display_name": r[2],
                    "phone_number": r[3],
                    "status": r[4]
                }
                for r in phone_result.fetchall()
            ]

            # Fetch active account settings
            active_wa = db.execute(
                text("SELECT waba_id, phone_number_id, display_phone_number FROM whatsapp_accounts WHERE tenant_id = :ws_id LIMIT 1"),
                {"ws_id": workspace_id}
            ).mappings().first()

            # Fetch Instagram
            ig_result = db.execute(
                text("SELECT instagram_id, username, followers, profile_picture, status FROM instagram_business_accounts WHERE workspace_id = :ws_id"),
                {"ws_id": workspace_id},
            )
            ig_accounts = [
                {"id": r[0], "username": r[1], "followers": r[2], "picture": r[3], "status": r[4]}
                for r in ig_result.fetchall()
            ]

            settings = get_settings()
            return {
                "connected": True,
                "app_id_configured": True,
                "app_secret_configured": True,
                "meta_app_id": settings.META_APP_ID,
                "token_valid": token_valid,
                "business_name": row[3],
                "business_id": row[2],
                "meta_user_id": row[1],
                "connected_at": str(row[7]) if row[7] else None,
                "updated_at": str(row[8]) if row[8] else None,
                "scopes": row[5],
                "platforms": {
                    "whatsapp": {
                        "connected": len(waba_accounts) > 0,
                        "assets": waba_accounts,
                        "phone_numbers": phone_numbers,
                        "active_waba_id": active_wa["waba_id"] if active_wa else None,
                        "active_phone_number_id": active_wa["phone_number_id"] if active_wa else None,
                        "active_display_phone_number": active_wa["display_phone_number"] if active_wa else None,
                    },
                    "facebook_pages": {
                        "connected": len(pages) > 0,
                        "assets": pages,
                    },
                    "facebook_lead_forms": {
                        "connected": len(lead_forms) > 0,
                        "assets": lead_forms,
                    },
                    "instagram": {
                        "connected": len(ig_accounts) > 0,
                        "assets": ig_accounts,
                    },
                    "meta_ads": {
                        "connected": len(ad_accounts) > 0,
                        "assets": ad_accounts,
                    },
                },
            }

    def disconnect(self, workspace_id: str) -> None:
        """Disconnect Meta integration and purge all stored tokens and assets."""
        with get_db() as db:
            # Order matters due to FK constraints: children first
            db.execute(text("DELETE FROM whatsapp_phone_numbers WHERE workspace_id = :ws_id"), {"ws_id": workspace_id})
            db.execute(text("DELETE FROM whatsapp_business_accounts WHERE workspace_id = :ws_id"), {"ws_id": workspace_id})
            db.execute(text("DELETE FROM instagram_business_accounts WHERE workspace_id = :ws_id"), {"ws_id": workspace_id})
            db.execute(text("DELETE FROM meta_ad_accounts WHERE workspace_id = :ws_id"), {"ws_id": workspace_id})
            db.execute(text("DELETE FROM facebook_lead_forms WHERE workspace_id = :ws_id"), {"ws_id": workspace_id})
            db.execute(text("DELETE FROM facebook_pages WHERE workspace_id = :ws_id"), {"ws_id": workspace_id})
            db.execute(
                text("UPDATE meta_integrations SET status = 'Disconnected', access_token = '' WHERE workspace_id = :ws_id"),
                {"ws_id": workspace_id},
            )
        logger.info(f"Meta integration disconnected for workspace: {workspace_id}")

    async def sync_tenant_resources(self, workspace_id: str, user_id: str = "default_user") -> dict:
        """Trigger programmatic discovery and refresh of all Meta assets for a tenant."""
        # Run automatic token expiry check and refresh first
        await self.verify_and_refresh_token(workspace_id)

        with get_db() as db:
            result = db.execute(
                text("""
                SELECT access_token, business_id, meta_user_id FROM meta_integrations
                WHERE workspace_id = :ws_id AND status = 'Connected'
                LIMIT 1
                """),
                {"ws_id": workspace_id}
            )
            row = result.fetchone()
            if not row:
                return {"success": False, "message": "No active Meta integration found for this workspace."}
            
            access_token = row[0]
            business_id = row[1]
            meta_user_id = row[2]

        # Fetch all platform assets
        pages = await self.fetch_pages(token=access_token)
        ad_accounts = await self.fetch_ad_accounts(token=access_token)
        
        # Fetch businesses and gather WhatsApp accounts for all businesses
        businesses = await self.fetch_businesses(token=access_token)
        whatsapp_accounts = []
        whatsapp_phone_numbers = []
        for biz in businesses:
            biz_wabas = await self.fetch_whatsapp_accounts(
                token=access_token, business_id=biz["id"]
            )
            whatsapp_accounts.extend(biz_wabas)
            
            for waba in biz_wabas:
                pns = await self.fetch_waba_phone_numbers(
                    token=access_token, waba_id=waba["id"]
                )
                for pn in pns:
                    pn["waba_id"] = waba["id"]
                whatsapp_phone_numbers.extend(pns)

        instagram_accounts = []
        lead_forms = []
        for page in pages:
            ig = await self.fetch_instagram_accounts(
                token=page.get("access_token", access_token),
                page_id=page["id"],
            )
            if ig:
                ig["page_id"] = page["id"]
                instagram_accounts.append(ig)

            forms = await self.fetch_lead_forms(
                token=page.get("access_token", access_token),
                page_id=page["id"],
            )
            for form in forms:
                form["page_id"] = page["id"]
            lead_forms.extend(forms)

        scopes = ",".join(META_SCOPES)

        # Reuse save_integration to insert/update assets in SQL
        self.save_integration(
            workspace_id=workspace_id,
            user_id=user_id,
            meta_user_id=meta_user_id,
            business_id=business_id,
            business_name="",
            access_token=access_token,
            token_expiry_seconds=5184000, # Default 60 days
            scopes=scopes,
            pages=pages,
            ad_accounts=ad_accounts,
            whatsapp_accounts=whatsapp_accounts,
            instagram_accounts=instagram_accounts,
            lead_forms=lead_forms,
            whatsapp_phone_numbers=whatsapp_phone_numbers,
        )

        return {
            "success": True,
            "platforms_discovered": {
                "facebook_pages": len(pages),
                "facebook_lead_forms": len(lead_forms),
                "ad_accounts": len(ad_accounts),
                "whatsapp_accounts": len(whatsapp_accounts),
                "instagram_accounts": len(instagram_accounts),
            }
        }

    async def verify_and_refresh_token(self, workspace_id: str) -> None:
        """Check if long-lived token is expiring in the next 7 days, and automatically refresh it."""
        with get_db() as db:
            result = db.execute(
                text("""
                SELECT access_token, token_expiry FROM meta_integrations
                WHERE workspace_id = :ws_id AND status = 'Connected'
                LIMIT 1
                """),
                {"ws_id": workspace_id}
            )
            row = result.fetchone()
            if not row:
                return
            
            access_token, token_expiry = row
            if token_expiry and token_expiry < (datetime.utcnow() + timedelta(days=7)):
                logger.info(f"Token for workspace {workspace_id} is close to expiry ({token_expiry}). Refreshing...")
                try:
                    refreshed = await self._extend_token(access_token)
                    new_token = refreshed["access_token"]
                    expires_in = refreshed.get("expires_in", 5184000)
                    new_expiry = datetime.utcnow() + timedelta(seconds=expires_in)
                    
                    db.execute(
                        text("""
                        UPDATE meta_integrations
                        SET access_token = :token, token_expiry = :expiry, updated_at = CURRENT_TIMESTAMP
                        WHERE workspace_id = :ws_id
                        """),
                        {"token": new_token, "expiry": new_expiry, "ws_id": workspace_id}
                    )
                    logger.info(f"Token successfully refreshed for workspace {workspace_id}.")
                except Exception as e:
                    logger.error(f"Failed to automatically refresh token for workspace {workspace_id}: {e}")

    async def fetch_ad_insights(self, token: str, ad_account_id: str) -> list[dict]:
        """Fetch marketing insights (spend, impressions, clicks, CTR, CPC) for an ad account."""
        if token == "mock_sandbox_access_token_xyz123abc":
            return [
                {
                    "campaign_id": "camp_111",
                    "campaign_name": "Summer Special Sale Ads",
                    "spend": "12500.50",
                    "impressions": "54200",
                    "clicks": "1280",
                    "ctr": "0.0236",
                    "cpc": "9.76"
                },
                {
                    "campaign_id": "camp_222",
                    "campaign_name": "WhatsApp Onboarding LeadGen",
                    "spend": "4500.00",
                    "impressions": "18900",
                    "clicks": "620",
                    "ctr": "0.0328",
                    "cpc": "7.25"
                }
            ]
        # Real Facebook API call
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                f"{self.graph_base}/{ad_account_id}/insights",
                params={
                    "level": "campaign",
                    "fields": "campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc",
                    "access_token": token,
                    "date_preset": "last_30d"
                },
            )
        if resp.status_code != 200:
            logger.warning(f"Failed to fetch ad insights for {ad_account_id}: {resp.text}")
            return []
        return resp.json().get("data", [])

    def log_webhook_event(self, workspace_id: Optional[str], event_type: str, payload: dict, status: str = "Success", error_message: str = None) -> str:
        """Log incoming webhook events to database for audit and error handling."""
        import json
        log_id = str(uuid.uuid4())
        payload_str = json.dumps(payload)
        with get_db() as db:
            db.execute(
                text("""
                INSERT INTO meta_webhook_logs (log_id, workspace_id, event_type, payload, status, error_message)
                VALUES (:log_id, :ws_id, :event_type, :payload, :status, :error_message)
                """),
                {
                    "log_id": log_id,
                    "ws_id": workspace_id,
                    "event_type": event_type,
                    "payload": payload_str,
                    "status": status,
                    "error_message": error_message
                }
            )
            db.commit()
        return log_id

    def update_webhook_log_status(self, log_id: str, status: str, error_message: str = None, increment_retry: bool = False):
        """Update processing status of logged webhook."""
        with get_db() as db:
            if increment_retry:
                db.execute(
                    text("""
                    UPDATE meta_webhook_logs
                    SET status = :status, error_message = :err, retry_count = retry_count + 1
                    WHERE log_id = :log_id
                    """),
                    {"status": status, "err": error_message, "log_id": log_id}
                )
            else:
                db.execute(
                    text("""
                    UPDATE meta_webhook_logs
                    SET status = :status, error_message = :err
                    WHERE log_id = :log_id
                    """),
                    {"status": status, "err": error_message, "log_id": log_id}
                )
            db.commit()



# Singleton
_meta_service = MetaService()

def get_meta_service() -> MetaService:
    return _meta_service
