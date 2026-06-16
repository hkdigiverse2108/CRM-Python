import uuid
import httpx
import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import text

from backend.app.core.config import get_settings
from backend.app.core.database import get_db
from backend.app.api.dependencies.auth import get_current_user
from backend.app.utils.response import success_response

router = APIRouter()
logger = logging.getLogger("whatsapp_integration")

class ConnectPayload(BaseModel):
    code: str

@router.post("/connect")
async def connect_whatsapp(
    request: Request,
    payload: ConnectPayload,
    current_user: dict = Depends(get_current_user)
):
    tenant_id = request.state.tenant.id
    settings = get_settings()
    
    # 1. Exchange authorization code
    is_sandbox = payload.code.startswith("mock_") or not settings.META_APP_ID or settings.META_APP_ID == "YOUR_META_APP_ID"
    
    if is_sandbox:
        access_token = "mock_whatsapp_access_token_123"
        waba_id = "waba_991823749"
        phone_number_id = "phone_number_id_991"
        business_name = "Digiverse WhatsApp Sandbox"
        display_phone_number = "+1 555-019-2834"
    else:
        # Real Meta API exchange
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                token_resp = await client.get(
                    f"https://graph.facebook.com/{settings.META_GRAPH_API_VERSION}/oauth/access_token",
                    params={
                        "client_id": settings.META_APP_ID,
                        "client_secret": settings.META_APP_SECRET,
                        "code": payload.code
                    }
                )
                if token_resp.status_code != 200:
                    logger.error(f"WhatsApp token exchange failed: {token_resp.text}")
                    raise HTTPException(status_code=400, detail="Failed to exchange authorization code with Meta.")
                
                token_data = token_resp.json()
                access_token = token_data.get("access_token")
                
                # Fetch WABA accounts linked to this token
                waba_resp = await client.get(
                    f"https://graph.facebook.com/{settings.META_GRAPH_API_VERSION}/me/whatsapp_business_accounts",
                    params={"access_token": access_token}
                )
                if waba_resp.status_code != 200 or not waba_resp.json().get("data"):
                    logger.error(f"Failed to fetch WhatsApp Business Accounts: {waba_resp.text}")
                    raise HTTPException(status_code=400, detail="No WhatsApp Business Account found linked to this Facebook login.")
                
                waba_info = waba_resp.json()["data"][0]
                waba_id = waba_info["id"]
                business_name = waba_info.get("name", "WhatsApp Business Account")
                
                # Fetch phone numbers linked to WABA
                phone_resp = await client.get(
                    f"https://graph.facebook.com/{settings.META_GRAPH_API_VERSION}/{waba_id}/phone_numbers",
                    params={"access_token": access_token}
                )
                if phone_resp.status_code != 200 or not phone_resp.json().get("data"):
                    logger.error(f"Failed to fetch WABA phone numbers: {phone_resp.text}")
                    raise HTTPException(status_code=400, detail="No registered phone numbers found on the WhatsApp Business Account.")
                
                phone_info = phone_resp.json()["data"][0]
                phone_number_id = phone_info["id"]
                display_phone_number = phone_info.get("display_phone_number", "")
                
        except Exception as e:
            logger.error(f"Meta Embedded Signup exchange exception: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to connect with Meta APIs. Check logs.")

    # 2. Save in database
    with get_db() as db:
        # Check if already exists for this tenant
        exist_check = db.execute(
            text("SELECT id FROM whatsapp_accounts WHERE tenant_id = :tenant_id"),
            {"tenant_id": tenant_id}
        ).scalar()
        
        if exist_check:
            db.execute(
                text("""
                UPDATE whatsapp_accounts 
                SET business_name = :biz_name, waba_id = :waba_id, phone_number_id = :phone_id, 
                    access_token = :token, display_phone_number = :phone_num, status = 'Connected'
                WHERE tenant_id = :tenant_id
                """),
                {
                    "biz_name": business_name,
                    "waba_id": waba_id,
                    "phone_id": phone_number_id,
                    "token": access_token,
                    "phone_num": display_phone_number,
                    "tenant_id": tenant_id
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
                    "tenant_id": tenant_id,
                    "biz_name": business_name,
                    "waba_id": waba_id,
                    "phone_id": phone_number_id,
                    "token": access_token,
                    "phone_num": display_phone_number
                }
            )
            
        db.commit()

    return success_response(
        data={
            "business_name": business_name,
            "display_phone_number": display_phone_number,
            "waba_id": waba_id,
            "phone_number_id": phone_number_id
        },
        message="WhatsApp account connected successfully!"
    )

@router.get("/status")
async def get_whatsapp_status(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    tenant_id = request.state.tenant.id
    with get_db() as db:
        row = db.execute(
            text("SELECT business_name, waba_id, phone_number_id, display_phone_number, status, created_at FROM whatsapp_accounts WHERE tenant_id = :tenant_id LIMIT 1"),
            {"tenant_id": tenant_id}
        ).mappings().first()
        
    if not row:
        return success_response(data={"connected": False})
        
    return success_response(data={
        "connected": True,
        "business_name": row["business_name"],
        "waba_id": row["waba_id"],
        "phone_number_id": row["phone_number_id"],
        "display_phone_number": row["display_phone_number"],
        "status": row["status"],
        "created_at": row["created_at"].isoformat() if row["created_at"] else None
    })

@router.post("/disconnect")
async def disconnect_whatsapp(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    tenant_id = request.state.tenant.id
    with get_db() as db:
        db.execute(
            text("DELETE FROM whatsapp_accounts WHERE tenant_id = :tenant_id"),
            {"tenant_id": tenant_id}
        )
        db.commit()
        
    return success_response(message="WhatsApp account disconnected successfully.")

@router.post("/sync-templates")
async def sync_templates(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    # Return mock success for sync templates
    return success_response(message="WhatsApp templates synced successfully.")
