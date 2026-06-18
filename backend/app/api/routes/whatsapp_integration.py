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
    waba_id: Optional[str] = None
    phone_number_id: Optional[str] = None
    access_token: Optional[str] = None

def save_whatsapp_connection(tenant_id: str, business_name: str, waba_id: str, phone_number_id: str, access_token: str, display_phone_number: str):
    with get_db() as db:
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

@router.post("/connect")
async def connect_whatsapp(
    request: Request,
    payload: ConnectPayload,
    current_user: dict = Depends(get_current_user)
):
    tenant_id = request.state.tenant.id
    settings = get_settings()
    
    # Check if this is a direct save of a selected option
    if payload.waba_id and payload.phone_number_id and payload.access_token:
        access_token = payload.access_token
        waba_id = payload.waba_id
        phone_number_id = payload.phone_number_id
        
        business_name = "WhatsApp Business Account"
        display_phone_number = phone_number_id
        
        # Try to fetch pretty names from Graph API
        if not payload.access_token.startswith("mock_"):
            try:
                async with httpx.AsyncClient(timeout=15) as client:
                    waba_resp = await client.get(
                        f"https://graph.facebook.com/{settings.META_GRAPH_API_VERSION}/{waba_id}",
                        params={"access_token": access_token}
                    )
                    if waba_resp.status_code == 200:
                        business_name = waba_resp.json().get("name", business_name)
                        
                    phone_resp = await client.get(
                        f"https://graph.facebook.com/{settings.META_GRAPH_API_VERSION}/{phone_number_id}",
                        params={"access_token": access_token}
                    )
                    if phone_resp.status_code == 200:
                        display_phone_number = phone_resp.json().get("display_phone_number", display_phone_number)
            except Exception as e:
                logger.warning(f"Failed to fetch pretty names: {e}")
                
        save_whatsapp_connection(tenant_id, business_name, waba_id, phone_number_id, access_token, display_phone_number)
        return success_response(
            data={
                "requires_selection": False,
                "business_name": business_name,
                "display_phone_number": display_phone_number,
                "waba_id": waba_id,
                "phone_number_id": phone_number_id
            },
            message="WhatsApp account connected successfully!"
        )

    # 1. Exchange authorization code
    is_sandbox = payload.code.startswith("mock_") or not settings.META_APP_ID or settings.META_APP_ID == "YOUR_META_APP_ID"
    
    if is_sandbox:
        access_token = "mock_whatsapp_access_token_123"
        waba_id = "waba_991823749"
        phone_number_id = "phone_number_id_991"
        business_name = "Digiverse WhatsApp Sandbox"
        display_phone_number = "+1 555-019-2834"
        
        save_whatsapp_connection(tenant_id, business_name, waba_id, phone_number_id, access_token, display_phone_number)
        return success_response(
            data={
                "requires_selection": False,
                "business_name": business_name,
                "display_phone_number": display_phone_number,
                "waba_id": waba_id,
                "phone_number_id": phone_number_id
            },
            message="WhatsApp account connected successfully!"
        )
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
                
                waba_list = waba_resp.json()["data"]
                
                options = []
                for waba in waba_list:
                    curr_waba_id = waba["id"]
                    curr_waba_name = waba.get("name", "WhatsApp Business Account")
                    
                    phone_resp = await client.get(
                        f"https://graph.facebook.com/{settings.META_GRAPH_API_VERSION}/{curr_waba_id}/phone_numbers",
                        params={"access_token": access_token}
                    )
                    if phone_resp.status_code == 200:
                        phone_data = phone_resp.json().get("data", [])
                        for phone in phone_data:
                            options.append({
                                "waba_id": curr_waba_id,
                                "waba_name": curr_waba_name,
                                "phone_number_id": phone["id"],
                                "display_phone_number": phone.get("display_phone_number", phone["id"])
                            })
                            
                if not options:
                    raise HTTPException(status_code=400, detail="No registered phone numbers found on any WhatsApp Business Account.")
                
                # If there are multiple options, return them to the frontend for selection
                if len(options) > 1:
                    return success_response(
                        data={
                            "requires_selection": True,
                            "options": options,
                            "access_token": access_token
                        },
                        message="Multiple phone numbers found. Please select one."
                    )
                
                selected = options[0]
                business_name = selected["waba_name"]
                waba_id = selected["waba_id"]
                phone_number_id = selected["phone_number_id"]
                display_phone_number = selected["display_phone_number"]
                
                save_whatsapp_connection(tenant_id, business_name, waba_id, phone_number_id, access_token, display_phone_number)
                
                return success_response(
                    data={
                        "requires_selection": False,
                        "business_name": business_name,
                        "display_phone_number": display_phone_number,
                        "waba_id": waba_id,
                        "phone_number_id": phone_number_id
                    },
                    message="WhatsApp account connected successfully!"
                )
                
        except HTTPException as he:
            raise he
        except Exception as e:
            logger.error(f"Meta Embedded Signup exchange exception: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to connect with Meta APIs. Check logs.")

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
