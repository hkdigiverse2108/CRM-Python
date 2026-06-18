"""
Meta OAuth API Routes
======================
Endpoints for Meta (Facebook) OAuth integration lifecycle:
  - Generate OAuth login URL
  - Handle OAuth callback (code exchange)
  - Get current integration status
  - Disconnect integration
"""

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from datetime import datetime
from backend.app.services.meta_service import MetaService, get_meta_service, META_SCOPES
from backend.app.api.dependencies.auth import get_current_user
from backend.app.utils.response import success_response

router = APIRouter()


class OAuthCallbackPayload(BaseModel):
    """Request body for the OAuth callback endpoint."""
    code: str
    state: str = ""


@router.get("/oauth/url")
async def get_oauth_url(
    request: Request,
    current_user: dict = Depends(get_current_user),
    meta_service: MetaService = Depends(get_meta_service),
):
    """
    Generate the Meta OAuth authorization URL.
    The frontend redirects the user to this URL to begin the OAuth flow.
    """
    tenant_id = request.state.tenant.id
    user_id = current_user["id"]
    result = meta_service.generate_oauth_url(workspace_id=tenant_id, user_id=user_id)
    return success_response(data=result, message="OAuth URL generated")


@router.post("/oauth/callback")
async def oauth_callback(
    request: Request,
    payload: OAuthCallbackPayload,
    current_user: dict = Depends(get_current_user),
    meta_service: MetaService = Depends(get_meta_service),
):
    """
    Exchange the OAuth authorization code for an access token.
    Fetches all Meta platform assets and stores them in the database.
    """
    tenant_id = request.state.tenant.id
    user_id = current_user["id"]

    # Step 1: Exchange code for long-lived token
    token_data = await meta_service.exchange_code_for_token(code=payload.code)
    access_token = token_data["access_token"]
    expires_in = token_data.get("expires_in", 5184000)

    # Step 2: Fetch user info
    user_info = await meta_service.fetch_user_info(token=access_token)
    meta_user_id = user_info.get("id", "")

    # Step 3: Fetch businesses
    businesses = await meta_service.fetch_businesses(token=access_token)
    business_id = businesses[0]["id"] if businesses else ""
    business_name = businesses[0]["name"] if businesses else ""

    # Step 4: Fetch all platform assets
    pages = await meta_service.fetch_pages(token=access_token)
    ad_accounts = await meta_service.fetch_ad_accounts(token=access_token)
    
    whatsapp_accounts = []
    for biz in businesses:
        biz_wabas = await meta_service.fetch_whatsapp_accounts(
            token=access_token, business_id=biz["id"]
        )
        whatsapp_accounts.extend(biz_wabas)

    # Fetch Instagram accounts from each page
    instagram_accounts = []
    lead_forms = []
    for page in pages:
        ig = await meta_service.fetch_instagram_accounts(
            token=page.get("access_token", access_token),
            page_id=page["id"],
        )
        if ig:
            ig["page_id"] = page["id"]
            instagram_accounts.append(ig)

        # Fetch lead forms for each page
        forms = await meta_service.fetch_lead_forms(
            token=page.get("access_token", access_token),
            page_id=page["id"],
        )
        for form in forms:
            form["page_id"] = page["id"]
        lead_forms.extend(forms)

    # Step 5: Persist everything to database
    scopes = ",".join(META_SCOPES)

    integration_id = meta_service.save_integration(
        workspace_id=tenant_id,
        user_id=user_id,
        meta_user_id=meta_user_id,
        business_id=business_id,
        business_name=business_name,
        access_token=access_token,
        token_expiry_seconds=expires_in,
        scopes=scopes,
        pages=pages,
        ad_accounts=ad_accounts,
        whatsapp_accounts=whatsapp_accounts,
        instagram_accounts=instagram_accounts,
        lead_forms=lead_forms,
    )

    return success_response(
        data={
            "integration_id": integration_id,
            "business_name": business_name,
            "platforms_discovered": {
                "facebook_pages": len(pages),
                "facebook_lead_forms": len(lead_forms),
                "ad_accounts": len(ad_accounts),
                "whatsapp_accounts": len(whatsapp_accounts),
                "instagram_accounts": len(instagram_accounts),
            },
        },
        message="Meta integration connected successfully!",
    )


@router.get("/status")
async def get_meta_status(
    request: Request,
    current_user: dict = Depends(get_current_user),
    meta_service: MetaService = Depends(get_meta_service),
):
    """
    Get the current Meta integration status for the workspace.
    Returns connection status and all linked platform assets.
    """
    tenant_id = request.state.tenant.id
    status = meta_service.get_status(workspace_id=tenant_id)
    return success_response(data=status, message="Meta integration status retrieved")


@router.post("/disconnect")
async def disconnect_meta(
    request: Request,
    current_user: dict = Depends(get_current_user),
    meta_service: MetaService = Depends(get_meta_service),
):
    """
    Disconnect Meta integration and purge all stored tokens.
    """
    tenant_id = request.state.tenant.id
    meta_service.disconnect(workspace_id=tenant_id)
    return success_response(message="Meta integration disconnected successfully")


class MetaConfigPayload(BaseModel):
    app_id: str
    app_secret: str


@router.post("/config")
async def update_meta_config(
    payload: MetaConfigPayload,
    current_user: dict = Depends(get_current_user),
):
    """
    Save Meta App credentials. Saves them in-memory to Settings and
    persists them by writing them back to the root .env file.
    """
    from backend.app.core.config import get_settings, _ENV_FILE
    import re

    settings = get_settings()
    settings.META_APP_ID = payload.app_id
    settings.META_APP_SECRET = payload.app_secret

    # Write changes back to the .env file for persistence
    if _ENV_FILE.exists():
        content = _ENV_FILE.read_text(encoding="utf-8")
        
        # Replace or add META_APP_ID
        if re.search(r"^META_APP_ID=.*", content, re.MULTILINE):
            content = re.sub(r"^META_APP_ID=.*", f"META_APP_ID={payload.app_id}", content, flags=re.MULTILINE)
        else:
            content += f"\nMETA_APP_ID={payload.app_id}"
            
        # Replace or add META_APP_SECRET
        if re.search(r"^META_APP_SECRET=.*", content, re.MULTILINE):
            content = re.sub(r"^META_APP_SECRET=.*", f"META_APP_SECRET={payload.app_secret}", content, flags=re.MULTILINE)
        else:
            content += f"\nMETA_APP_SECRET={payload.app_secret}"

        # Normalize line breaks
        _ENV_FILE.write_text(content.strip() + "\n", encoding="utf-8")

    return success_response(message="Meta Developer App credentials updated successfully")


# ── Absolute Path Router for Meta Integration ────────────────────
from fastapi.responses import RedirectResponse, Response
from typing import Optional

meta_integration_router = APIRouter()

@meta_integration_router.get("/api/auth/meta/login")
async def meta_login(
    request: Request,
    token: Optional[str] = None,
    tenant_id: Optional[str] = None,
    user_id: Optional[str] = None,
    meta_service: MetaService = Depends(get_meta_service),
):
    """
    Generate Meta OAuth URL and redirect user to Facebook Login.
    """
    # Try to extract user details from JWT token
    auth_token = token
    if not auth_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            auth_token = auth_header.split("Bearer ")[1].strip()

    if auth_token:
        from backend.app.core.security import decode_token
        payload = decode_token(auth_token)
        if payload:
            user_id = user_id or payload.get("sub")
            tenant_id = tenant_id or payload.get("tenant_id")

    # Fallback to query params or defaults
    tenant_id = tenant_id or request.query_params.get("tenant_id") or "rapidmodel_corp"
    user_id = user_id or request.query_params.get("user_id") or "default_user"

    result = meta_service.generate_oauth_url(workspace_id=tenant_id, user_id=user_id)
    return RedirectResponse(url=result["oauth_url"])


@meta_integration_router.get("/api/auth/meta/callback")
async def meta_callback(
    request: Request,
    code: str,
    state: str = "",
    meta_service: MetaService = Depends(get_meta_service),
):
    """
    Exchange code for access token, fetch all assets, and store them.
    """
    # Parse tenant and user from state
    parts = state.split(":")
    tenant_id = parts[0] if len(parts) > 0 else "rapidmodel_corp"
    user_id = parts[1] if len(parts) > 1 else "default_user"

    # Step 1: Exchange code for long-lived token
    token_data = await meta_service.exchange_code_for_token(code=code)
    access_token = token_data["access_token"]
    expires_in = token_data.get("expires_in", 5184000)

    # Step 2: Fetch user info
    user_info = await meta_service.fetch_user_info(token=access_token)
    meta_user_id = user_info.get("id", "")

    # Step 3: Fetch businesses
    businesses = await meta_service.fetch_businesses(token=access_token)
    business_id = businesses[0]["id"] if businesses else ""
    business_name = businesses[0]["name"] if businesses else ""

    # Step 4: Fetch all platform assets
    pages = await meta_service.fetch_pages(token=access_token)
    ad_accounts = await meta_service.fetch_ad_accounts(token=access_token)
    
    whatsapp_accounts = []
    for biz in businesses:
        biz_wabas = await meta_service.fetch_whatsapp_accounts(
            token=access_token, business_id=biz["id"]
        )
        whatsapp_accounts.extend(biz_wabas)

    # Fetch Instagram accounts and lead forms from each page
    instagram_accounts = []
    lead_forms = []
    for page in pages:
        ig = await meta_service.fetch_instagram_accounts(
            token=page.get("access_token", access_token),
            page_id=page["id"],
        )
        if ig:
            ig["page_id"] = page["id"]
            instagram_accounts.append(ig)

        forms = await meta_service.fetch_lead_forms(
            token=page.get("access_token", access_token),
            page_id=page["id"],
        )
        for form in forms:
            form["page_id"] = page["id"]
        lead_forms.extend(forms)

    # Step 5: Save everything to database according to tenant_id and user_id
    scopes = ",".join(META_SCOPES)

    integration_id = meta_service.save_integration(
        workspace_id=tenant_id,
        user_id=user_id,
        meta_user_id=meta_user_id,
        business_id=business_id,
        business_name=business_name,
        access_token=access_token,
        token_expiry_seconds=expires_in,
        scopes=scopes,
        pages=pages,
        ad_accounts=ad_accounts,
        whatsapp_accounts=whatsapp_accounts,
        instagram_accounts=instagram_accounts,
        lead_forms=lead_forms,
    )

    # Redirect the user back to the CRM integration hub on frontend
    from backend.app.core.config import get_settings
    settings = get_settings()
    host = request.headers.get("host", "")
    if "hkdigiverse.com" in host:
        frontend_url = "https://crm.hkdigiverse.com"
    else:
        frontend_url = settings.frontend_url
        if "https" in str(request.url):
            frontend_url = frontend_url.replace("http://", "https://")

    return RedirectResponse(url=f"{frontend_url}/admin/integrations/meta?status=success")


@meta_integration_router.get("/webhooks/meta")
async def verify_webhook(request: Request):
    """
    Verify Hub Challenge token for Meta Webhook verification.
    """
    from backend.app.core.config import get_settings
    settings = get_settings()
    
    params = request.query_params
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")
    
    expected_token = settings.META_WEBHOOK_VERIFY_TOKEN
    
    import logging
    logger = logging.getLogger("meta_webhooks")
    logger.info(f"Webhook verification request: mode={mode}, token_provided={bool(token)}")
    
    if mode == "subscribe" and token == expected_token:
        logger.info("Webhook verification succeeded.")
        return Response(content=challenge, media_type="text/plain")
    
    logger.warning("Webhook verification failed.")
    from fastapi import HTTPException
    raise HTTPException(status_code=403, detail="Verification token mismatch")


async def _create_lead_if_not_exists(workspace_id: str, name: str, phone: str, email: str, source: str, notes: str = None):
    from backend.app.core.database import get_db
    from backend.app.repositories.lead_repo import get_lead_repository
    from backend.app.models.lead import Lead
    from sqlalchemy import text
    import uuid
    from datetime import datetime, timezone
    
    import logging
    logger = logging.getLogger("meta_webhooks")

    with get_db() as db:
        # Check for existing lead by phone
        sql = text("SELECT lead_id FROM leads WHERE workspace_id = :ws_id AND phone_primary = :phone AND deleted_at IS NULL LIMIT 1")
        res = db.execute(sql, {"ws_id": workspace_id, "phone": phone}).scalar()
        if not res:
            lead_repo = get_lead_repository()
            new_lead = Lead(
                id=str(uuid.uuid4()),
                name=name,
                email=email or "",
                phone=phone,
                company="Meta Lead Discovery",
                source=source,
                status="new",
                score=10,
                assigned_to=None,
                tenant_id=workspace_id,
                notes=notes or "Lead automatically created via Meta Webhook.",
                value=0.0,
                created_at=datetime.utcnow().replace(tzinfo=timezone.utc),
                updated_at=datetime.utcnow().replace(tzinfo=timezone.utc),
            )
            await lead_repo.create(new_lead)
            logger.info(f"Automatically created lead '{name}' for workspace '{workspace_id}' from source '{source}'")
        else:
            logger.info(f"Lead with phone '{phone}' already exists in workspace '{workspace_id}'. Skipping duplication.")


@meta_integration_router.post("/webhooks/meta")
async def process_webhook(
    request: Request,
    meta_service: MetaService = Depends(get_meta_service),
):
    """
    Receive and process events from Facebook Page, Instagram, Lead Ads, and WhatsApp.
    """
    import logging
    logger = logging.getLogger("meta_webhooks")
    from backend.app.core.database import get_db
    from sqlalchemy import text
    
    try:
        payload = await request.json()
    except Exception as e:
        logger.error(f"Failed to parse incoming webhook JSON: {str(e)}")
        return {"status": "error", "message": "Invalid JSON body"}
    
    logger.info(f"Received Meta Webhook event payload safely: {payload}")
    
    # Extract event type and workspace
    event_obj = payload.get("object", "unknown")
    workspace_id = "rapidmodel_corp" # default fallback
    
    # Log webhook as Pending
    log_id = meta_service.log_webhook_event(
        workspace_id=workspace_id,
        event_type=event_obj,
        payload=payload,
        status="Pending"
    )
    
    try:
        # ── PLACEHOLDER HANDLERS FOR WEBHOOK EVENTS ──────────────────────
        
        # 1. Detect WhatsApp events
        if event_obj == "whatsapp_business_account":
            for entry in payload.get("entry", []):
                for change in entry.get("changes", []):
                    value = change.get("value", {})
                    # Check for messages
                    if "messages" in value:
                        for msg in value.get("messages", []):
                            phone = msg.get("from")
                            phone_id = value.get("metadata", {}).get("phone_number_id")
                            if phone_id:
                                with get_db() as db:
                                    ws_res = db.execute(
                                        text("SELECT workspace_id FROM whatsapp_phone_numbers WHERE phone_number_id = :pid LIMIT 1"),
                                        {"pid": phone_id}
                                    ).scalar()
                                    if ws_res:
                                        workspace_id = ws_res

                            body = ""
                            if "text" in msg:
                                body = msg.get("text", {}).get("body", "")

                            logger.info(f"[WHATSAPP MESSAGE EVENT] ID: {msg.get('id')}, From: {phone}, Text: {body}")
                            
                            await _create_lead_if_not_exists(
                                workspace_id=workspace_id,
                                name=f"WhatsApp Contact {phone}",
                                phone=phone,
                                email="",
                                source="whatsapp",
                                notes=f"Created via incoming WhatsApp message: '{body}'"
                            )
                    
                    elif "statuses" in value:
                        for status in value.get("statuses", []):
                            logger.info(f"[WHATSAPP STATUS EVENT] ID: {status.get('id')}, Status: {status.get('status')}")

        # 2. Detect Facebook Page events
        elif event_obj == "page":
            for entry in payload.get("entry", []):
                for change in entry.get("changes", []):
                    field = change.get("field", "")
                    value = change.get("value", {})
                    
                    if field == "leadgen":
                        lead_id = value.get("leadgen_id")
                        form_id = value.get("form_id")
                        page_id = value.get("page_id")
                        logger.info(f"[FACEBOOK LEAD ADS EVENT] Lead ID: {lead_id}, Form ID: {form_id}, Page: {page_id}")
                        
                        if page_id:
                            with get_db() as db:
                                ws_res = db.execute(
                                    text("SELECT workspace_id FROM facebook_pages WHERE page_id = :pid LIMIT 1"),
                                    {"pid": page_id}
                                ).scalar()
                                if ws_res:
                                    workspace_id = ws_res

                        await _create_lead_if_not_exists(
                            workspace_id=workspace_id,
                            name=f"Meta Ad Lead {lead_id}",
                            phone=f"Ad-Phone-{lead_id}",
                            email=f"ad-lead-{lead_id}@example.com",
                            source="facebook_lead_forms",
                            notes=f"Form ID: {form_id}, Leadgen ID: {lead_id}"
                        )
                    
                    elif field == "feed":
                        logger.info(f"[FACEBOOK PAGE FEED EVENT] Page change detected: {value.get('item')}, Verb: {value.get('verb')}")

        # 3. Detect Instagram events
        elif event_obj == "instagram":
            for entry in payload.get("entry", []):
                if "messaging" in entry:
                    for msg in entry.get("messaging", []):
                        sender_id = msg.get("sender", {}).get("id")
                        logger.info(f"[INSTAGRAM MESSAGE EVENT] Sender: {sender_id}")
                        await _create_lead_if_not_exists(
                            workspace_id=workspace_id,
                            name=f"Instagram User {sender_id}",
                            phone=f"IG-Phone-{sender_id}",
                            email="",
                            source="instagram",
                            notes=f"Created from direct message from Instagram user {sender_id}"
                        )
                
                for change in entry.get("changes", []):
                    logger.info(f"[INSTAGRAM CHANGE EVENT] Field: {change.get('field')}")

        # Update status to Success and associate correct workspace_id
        meta_service.update_webhook_log_status(log_id, "Success")
        
        # update logged workspace_id if it changed
        if workspace_id != "rapidmodel_corp":
            with get_db() as db:
                db.execute(
                    text("UPDATE meta_webhook_logs SET workspace_id = :ws_id WHERE log_id = :log_id"),
                    {"ws_id": workspace_id, "log_id": log_id}
                )
                db.commit()
                
    except Exception as e:
        logger.error(f"Error processing webhook event: {str(e)}")
        meta_service.update_webhook_log_status(log_id, "Failed", error_message=str(e))
        return {"status": "error", "message": "Processing failed, logged for retry."}

    return {"status": "success"}


@meta_integration_router.get("/api/meta/ads/insights")
async def get_ad_insights(
    request: Request,
    ad_account_id: str,
    current_user: dict = Depends(get_current_user),
    meta_service: MetaService = Depends(get_meta_service),
):
    """
    Fetch marketing insights (spend, CTR, CPC, impressions) for a specific Meta Ad Account.
    """
    tenant_id = request.state.tenant.id
    
    # Get user token for the workspace
    from backend.app.core.database import get_db
    from sqlalchemy import text
    with get_db() as db:
        token = db.execute(
            text("SELECT access_token FROM meta_integrations WHERE workspace_id = :ws_id AND status = 'Connected' LIMIT 1"),
            {"ws_id": tenant_id}
        ).scalar()
        
    if not token:
        from backend.app.core.config import get_settings
        settings = get_settings()
        is_sandbox = not settings.META_APP_ID or settings.META_APP_ID == "YOUR_META_APP_ID"
        if is_sandbox:
            token = "mock_sandbox_access_token_xyz123abc"
        else:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="Meta integration not active for this workspace.")

    insights = await meta_service.fetch_ad_insights(token=token, ad_account_id=ad_account_id)
    return success_response(data=insights, message="Ad insights fetched successfully")



@meta_integration_router.post("/api/meta/sync")
async def sync_meta_resources(
    request: Request,
    current_user: dict = Depends(get_current_user),
    meta_service: MetaService = Depends(get_meta_service),
):
    """
    Trigger a manual background synchronization of all Meta platform resources.
    """
    tenant_id = request.state.tenant.id
    user_id = current_user["id"]
    
    result = await meta_service.sync_tenant_resources(workspace_id=tenant_id, user_id=user_id)
    return success_response(data=result, message="Meta resources synchronized successfully!")


@meta_integration_router.post("/api/meta/test-webhook")
async def test_webhook_simulation(
    request: Request,
    event_type: str = "whatsapp", # "whatsapp" | "leadgen"
):
    """
    Test utility to simulate webhook event payloads for Meta App Review and developer verification.
    """
    import httpx
    from backend.app.core.config import get_settings
    settings = get_settings()
    url = f"http://localhost:{settings.APP_PORT}/webhooks/meta"
    
    if event_type == "whatsapp":
        payload = {
            "object": "whatsapp_business_account",
            "entry": [{
                "changes": [{
                    "field": "messages",
                    "value": {
                        "messaging_product": "whatsapp",
                        "metadata": {
                            "display_phone_number": "15550000000",
                            "phone_number_id": "mock_phone_number_id_1"
                        },
                        "contacts": [{"profile": {"name": "Test User"}, "wa_id": "1234567890"}],
                        "messages": [{
                            "from": "1234567890",
                            "id": "wamid.HBgLMTIzNDU2Nzg5MAcVAwU0NDU1NjY3Nzg5OQA=",
                            "timestamp": "1672531199",
                            "text": {"body": "Hello CRM! This is a test WhatsApp message."},
                            "type": "text"
                        }]
                    }
                }]
            }]
        }
    else: # leadgen
        payload = {
            "object": "page",
            "entry": [{
                "id": "mock_page_id_1",
                "time": 1672531199,
                "changes": [{
                    "field": "leadgen",
                    "value": {
                        "ad_id": "mock_ad_id_123",
                        "form_id": "mock_form_id_456",
                        "leadgen_id": f"mock_lead_id_{int(datetime.utcnow().timestamp())}",
                        "page_id": "mock_page_id_1",
                        "adgroup_id": "mock_adgroup_id_789"
                    }
                }]
            }]
        }
        
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=payload)
        
    return {
        "status": "success",
        "simulated_event": event_type,
        "webhook_response": resp.json()
    }


@meta_integration_router.get("/data-deletion")
async def data_deletion():
    """
    Handle user data deletion request (Facebook compliance requirement).
    """
    import logging
    logger = logging.getLogger("meta_oauth")
    logger.info("Data deletion compliance request received.")
    
    return {
        "status": "success",
        "message": "User data deletion request received."
    }



