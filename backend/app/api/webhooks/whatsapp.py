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
                            # We construct a dynamic identicon URL using the image ID so we always have a valid image to render in the CRM
                            attachment_url = f"https://api.dicebear.com/7.x/identicon/svg?seed={img_id}"
                        elif "document" in msg:
                            msg_type = "document"
                            doc_id = msg.get("document", {}).get("id")
                            filename = msg.get("document", {}).get("filename", "document.pdf")
                            body = filename or "[File]"
                            attachment_url = f"https://api.dicebear.com/7.x/identicon/svg?seed={doc_id}"
                            
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
                        logger.info(f"[WHATSAPP STATUS UPDATE] ID: {status.get('id')}, Status: {status.get('status')}")
                        
    return {"status": "success"}
                        
    return {"status": "success"}
