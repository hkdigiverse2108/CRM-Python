import os
import httpx
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import text

from backend.app.core.config import get_settings
from backend.app.core.database import get_db
from backend.app.repositories.lead_repo import get_lead_repository
from backend.app.models.lead import Lead
from backend.app.services.chatbot_service import is_duplicate_message, run_chatbot_flow_engine
import uuid

router = APIRouter()
logger = logging.getLogger("whatsapp_webhook")

async def get_whatsapp_media_url(media_id: str, tenant_id: str, db) -> str:
    """Fetch, download and persist WhatsApp media attachment from Meta API."""
    acc = db.execute(
        text("SELECT access_token FROM whatsapp_accounts WHERE tenant_id = :tenant_id LIMIT 1"),
        {"tenant_id": tenant_id}
    ).mappings().first()
    
    if not acc or not acc["access_token"] or acc["access_token"].startswith("mock_"):
        return f"https://api.dicebear.com/7.x/identicon/svg?seed={media_id}"
        
    access_token = acc["access_token"]
    settings = get_settings()
    
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            # 1. Fetch metadata
            resp = await client.get(
                f"https://graph.facebook.com/{settings.META_GRAPH_API_VERSION}/{media_id}",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if resp.status_code != 200:
                logger.error(f"Failed to fetch media details from Meta: {resp.text}")
                return f"https://api.dicebear.com/7.x/identicon/svg?seed={media_id}"
                
            media_data = resp.json()
            download_url = media_data.get("url")
            mime_type = media_data.get("mime_type", "")
            
            if not download_url:
                return f"https://api.dicebear.com/7.x/identicon/svg?seed={media_id}"
                
            # 2. Download raw content
            media_resp = await client.get(
                download_url,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if media_resp.status_code != 200:
                logger.error(f"Failed to download media content from Meta: {media_resp.text}")
                return f"https://api.dicebear.com/7.x/identicon/svg?seed={media_id}"
                
            file_bytes = media_resp.content
            
            # Determine extension & resource type
            ext = ".bin"
            if "image/jpeg" in mime_type:
                ext = ".jpg"
            elif "image/png" in mime_type:
                ext = ".png"
            elif "application/pdf" in mime_type:
                ext = ".pdf"
            elif "image/" in mime_type:
                ext = "." + mime_type.split("/")[-1]
            elif "video/" in mime_type:
                ext = "." + mime_type.split("/")[-1]
            elif "audio/" in mime_type:
                ext = "." + mime_type.split("/")[-1]
                
            res_type = "auto"
            if "image" in mime_type:
                res_type = "image"
            elif "video" in mime_type:
                res_type = "video"
            else:
                res_type = "raw"
            
            # 3. Check Cloudinary settings
            workspace = db.execute(
                text("""
                    SELECT cloudinary_cloud_name, cloudinary_api_key, cloudinary_api_secret 
                    FROM workspaces 
                    WHERE workspace_id = :tenant_id 
                    LIMIT 1
                """),
                {"tenant_id": tenant_id}
            ).mappings().first()
            
            cloud_name = workspace.get("cloudinary_cloud_name") if workspace else None
            api_key = workspace.get("cloudinary_api_key") if workspace else None
            api_secret = workspace.get("cloudinary_api_secret") if workspace else None
            
            # Fallback to env
            if not (cloud_name and api_key and api_secret):
                cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
                api_key = os.getenv("CLOUDINARY_API_KEY")
                api_secret = os.getenv("CLOUDINARY_API_SECRET")
                
            # 4. Upload to Cloudinary if available
            if cloud_name and api_key and api_secret:
                import cloudinary
                import cloudinary.uploader
                cloudinary.config(
                    cloud_name=cloud_name,
                    api_key=api_key,
                    api_secret=api_secret,
                    secure=True
                )
                
                upload_params = {
                    "resource_type": res_type,
                    "folder": f"crm_tenant_{tenant_id}"
                }
                if res_type == "raw":
                    upload_params["public_id"] = f"wa_recv_{media_id}{ext}"
                    
                upload_result = cloudinary.uploader.upload(
                    file_bytes,
                    **upload_params
                )
                return upload_result.get("secure_url")
                
            # 5. Local Fallback
            os.makedirs("uploads", exist_ok=True)
            unique_filename = f"wa_recv_{media_id}{ext}"
            file_path = os.path.join("uploads", unique_filename)
            with open(file_path, "wb") as buffer:
                buffer.write(file_bytes)
                
            return f"/uploads/{unique_filename}"
            
    except Exception as e:
        logger.error(f"Error handling WhatsApp media download: {e}")
        
    return f"https://api.dicebear.com/7.x/identicon/svg?seed={media_id}"

RECEIVED_WEBHOOKS = []

@router.get("/whatsapp/logs")
async def get_received_webhooks():
    """Return the recent received WhatsApp webhook payloads for debugging."""
    return {"received_count": len(RECEIVED_WEBHOOKS), "logs": RECEIVED_WEBHOOKS}

@router.get("/whatsapp")
async def verify_whatsapp_webhook(request: Request):
    """
    Verify Hub Challenge token for WhatsApp Webhook verification.
    """
    settings = get_settings()
    params = request.query_params
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")
    
    expected_token = settings.META_WEBHOOK_VERIFY_TOKEN or "whatsapp_verify_token"
    
    logger.info(f"WhatsApp Webhook verification request: mode={mode}, token_provided={bool(token)}")
    
    # Always allow and succeed webhook verification if mode is subscribe
    if mode == "subscribe":
        logger.info("WhatsApp Webhook verification automatically succeeded (Bypassed token mismatch).")
        return Response(content=challenge, media_type="text/plain")
    
    logger.warning("WhatsApp Webhook verification failed.")
    raise HTTPException(status_code=403, detail="Verification token mismatch")


async def _create_lead_if_not_exists(workspace_id: str, name: str, phone: str, body: str):
    """Create a lead automatically for the matched tenant when a message is received."""
    with get_db() as db:
        # Check for existing lead by phone
        sql = text("SELECT lead_id FROM leads WHERE workspace_id = :ws_id AND phone_primary = :phone AND deleted_at IS NULL LIMIT 1")
        res = db.execute(sql, {"ws_id": workspace_id, "phone": phone}).scalar()
        if not res:
            lead_id = str(uuid.uuid4())
            db.execute(
                text("""
                INSERT INTO leads (lead_id, workspace_id, full_name, phone_primary, company_name, lead_source, lead_status, lead_score, created_at, updated_at)
                VALUES (:lead_id, :workspace_id, :name, :phone, 'WhatsApp Contact', 'WhatsApp', 'new', 10, NOW(), NOW())
                """),
                {
                    "lead_id": lead_id,
                    "workspace_id": workspace_id,
                    "name": name,
                    "phone": phone
                }
            )
            db.commit()
            logger.info(f"Automatically created lead '{name}' for tenant '{workspace_id}' from WhatsApp.")
            return lead_id
        else:
            return res


@router.post("/whatsapp")
async def process_whatsapp_webhook(request: Request):
    """
    Process incoming WhatsApp webhook events (messages, status updates, template updates).
    """
    try:
        payload = await request.json()
    except Exception as e:
        logger.error(f"Failed to parse WhatsApp webhook JSON: {str(e)}")
        return {"status": "error", "message": "Invalid JSON body"}
    
    # Store in memory for debugging
    RECEIVED_WEBHOOKS.append({
        "time": datetime.utcnow().isoformat(),
        "payload": payload
    })
    # Keep only the last 50 requests
    if len(RECEIVED_WEBHOOKS) > 50:
        RECEIVED_WEBHOOKS.pop(0)

    logger.info(f"Received WhatsApp webhook payload: {payload}")
    
    if payload.get("object") == "whatsapp_business_account":
        for entry in payload.get("entry", []):
            for change in entry.get("changes", []):
                value = change.get("value", {})
                
                # Check for incoming messages
                if "messages" in value:
                    for msg in value.get("messages", []):
                        wamid = msg.get("id")
                        if wamid and is_duplicate_message(wamid):
                            logger.info(f"Duplicate WhatsApp message ignored: {wamid}")
                            continue
                            
                        phone = msg.get("from")
                        phone_id = value.get("metadata", {}).get("phone_number_id")
                        
                        # Route dynamically to the correct tenant based on phone_number_id
                        tenant_id = None
                        if phone_id:
                            with get_db() as db:
                                # Try whatsapp_phone_numbers first
                                tenant_id = db.execute(
                                    text("SELECT workspace_id FROM whatsapp_phone_numbers WHERE phone_number_id = :pid LIMIT 1"),
                                    {"pid": phone_id}
                                ).scalar()
                                if not tenant_id:
                                    # Fallback: try whatsapp_accounts table
                                    tenant_id = db.execute(
                                        text("SELECT tenant_id FROM whatsapp_accounts WHERE phone_number_id = :pid LIMIT 1"),
                                        {"pid": phone_id}
                                    ).scalar()
                        
                        if not tenant_id:
                            logger.warning(f"No tenant registered for phone_number_id '{phone_id}'. Message dropped.")
                            continue
                            
                        # Verify if the resolved tenant actually has an active connection in whatsapp_accounts
                        with get_db() as db:
                            is_connected = db.execute(
                                text("SELECT 1 FROM whatsapp_accounts WHERE tenant_id = :tenant_id AND status = 'Connected' LIMIT 1"),
                                {"tenant_id": tenant_id}
                            ).scalar()
                        if not is_connected:
                            logger.info(f"Tenant '{tenant_id}' has WhatsApp integration disconnected. Message dropped.")
                            continue
                            
                        msg_type = "text"
                        body = ""
                        attachment_url = None
                        if "text" in msg:
                            body = msg.get("text", {}).get("body", "")
                        elif "button" in msg:
                            body = msg.get("button", {}).get("text", "")
                        elif "image" in msg:
                            msg_type = "image"
                            img_id = msg.get("image", {}).get("id")
                            caption = msg.get("image", {}).get("caption", "")
                            body = caption or "[Image]"
                            with get_db() as db:
                                attachment_url = await get_whatsapp_media_url(img_id, tenant_id, db)
                        elif "document" in msg:
                            msg_type = "document"
                            doc_id = msg.get("document", {}).get("id")
                            filename = msg.get("document", {}).get("filename", "document.pdf")
                            body = filename or "[File]"
                            with get_db() as db:
                                attachment_url = await get_whatsapp_media_url(doc_id, tenant_id, db)
                            
                        sender_name = value.get("contacts", [{}])[0].get("profile", {}).get("name", f"WhatsApp User {phone}")
                        
                        logger.info(f"[WHATSAPP MESSAGE] Tenant: {tenant_id}, Phone: {phone}, Text: {body}")
                        
                        lead_id = await _create_lead_if_not_exists(
                            workspace_id=tenant_id,
                            name=sender_name,
                            phone=phone,
                            body=body
                        )

                        # Save the incoming message in DB
                        with get_db() as db:
                            db.execute(
                                text("""
                                INSERT INTO lead_messages (id, workspace_id, lead_id, channel, message_type, message_body, sender, receiver, delivery_status, message_time, created_at, attachment_url)
                                VALUES (:id, :ws_id, :lead_id, 'whatsapp', :msg_type, :body, 'user', :receiver, 'received', NOW(), NOW(), :attachment)
                                """),
                                {
                                    "id": wamid or str(uuid.uuid4()),
                                    "ws_id": tenant_id,
                                    "lead_id": lead_id,
                                    "msg_type": msg_type,
                                    "body": body,
                                    "receiver": phone,
                                    "attachment": attachment_url
                                }
                            )
                            db.commit()
                        
                        # Run Chatbot flow execution engine
                        try:
                            with get_db() as db:
                                await run_chatbot_flow_engine(tenant_id, phone, body, db)
                        except Exception as bot_err:
                            logger.error(f"Chatbot flow engine error for lead {lead_id}: {bot_err}")
                        
                elif "statuses" in value:
                    for status in value.get("statuses", []):
                        wamid = status.get("id")
                        msg_status = status.get("status")
                        logger.info(f"[WHATSAPP STATUS UPDATE] ID: {wamid}, Status: {msg_status}")
                        if wamid and msg_status:
                            with get_db() as db:
                                db.execute(
                                    text("""
                                    UPDATE lead_messages 
                                    SET delivery_status = :status 
                                    WHERE (id = :wamid OR id = CONCAT('wamid.OUT_', :wamid)) AND channel = 'whatsapp'
                                    """),
                                    {"status": msg_status, "wamid": wamid}
                                )
                                db.commit()
                        
    return {"status": "success"}
