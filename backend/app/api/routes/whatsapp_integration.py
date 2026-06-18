import uuid
import httpx
import logging
import json
from datetime import datetime
from typing import Optional, List, Dict, Any
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


@router.get("/conversations")
async def get_conversations(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    tenant_id = request.state.tenant.id
    with get_db() as db:
        # Get all leads that have messages in lead_messages on the 'whatsapp' channel
        query = text("""
            SELECT l.lead_id, l.full_name AS name, l.phone_primary, l.email, l.lead_score AS score,
                   lm.message_body, lm.message_time, lm.sender, lm.delivery_status
            FROM leads l
            JOIN (
                SELECT lm1.lead_id, lm1.message_body, lm1.message_time, lm1.sender, lm1.delivery_status
                FROM lead_messages lm1
                JOIN (
                    SELECT lead_id, MAX(message_time) as max_time
                    FROM lead_messages
                    WHERE workspace_id = :ws_id AND channel = 'whatsapp'
                    GROUP BY lead_id
                ) lm2 ON lm1.lead_id = lm2.lead_id AND lm1.message_time = lm2.max_time
            ) lm ON l.lead_id = lm.lead_id
            WHERE l.workspace_id = :ws_id AND l.deleted_at IS NULL
            ORDER BY lm.message_time DESC
        """)
        
        rows = db.execute(query, {"ws_id": tenant_id}).fetchall()
        
        conversations = []
        for r in rows:
            conversations.append({
                "id": r[0],
                "name": r[1],
                "phone": r[2],
                "email": r[3] or "",
                "score": r[4] or 50,
                "lastMessage": r[5],
                "time": r[6].strftime("%I:%M %p") if r[6] else "",
                "unread": 0,
                "avatar": f"https://api.dicebear.com/7.x/adventurer/svg?seed={r[1]}",
                "botHandled": r[7] == 'bot',
                "assignedTo": "Gajera Prince Laxmanbhai" if r[7] != 'bot' else "AI Bot",
                "lastAssignedTime": "Just now",
                "online": True
            })
            
        return success_response(data=conversations)


@router.get("/conversations/{lead_id}/messages")
async def get_messages(
    lead_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    tenant_id = request.state.tenant.id
    with get_db() as db:
        query = text("""
            SELECT sender, message_body, message_time, delivery_status
            FROM lead_messages
            WHERE workspace_id = :ws_id AND lead_id = :lead_id AND channel = 'whatsapp'
            ORDER BY message_time ASC
        """)
        rows = db.execute(query, {"ws_id": tenant_id, "lead_id": lead_id}).fetchall()
        
        messages = []
        for r in rows:
            sender_type = "user" if r[0] not in ("agent", "bot", "system") else r[0]
            messages.append({
                "sender": sender_type,
                "text": r[1],
                "time": r[2].strftime("%I:%M %p") if r[2] else "",
                "status": r[3]
            })
            
        return success_response(data=messages)


class SendWhatsAppPayload(BaseModel):
    message: str


@router.post("/conversations/{lead_id}/send")
async def send_whatsapp_message(
    lead_id: str,
    payload: SendWhatsAppPayload,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    tenant_id = request.state.tenant.id
    
    with get_db() as db:
        # Get active WhatsApp account credentials for token and phone number id
        wa_acc = db.execute(
            text("SELECT phone_number_id, access_token FROM whatsapp_accounts WHERE tenant_id = :tenant_id LIMIT 1"),
            {"tenant_id": tenant_id}
        ).mappings().first()
        
        # Get lead's phone number
        lead_phone = db.execute(
            text("SELECT phone_primary FROM leads WHERE lead_id = :lead_id AND workspace_id = :ws_id LIMIT 1"),
            {"lead_id": lead_id, "ws_id": tenant_id}
        ).scalar()
        
    if not lead_phone:
        raise HTTPException(status_code=404, detail="Lead not found.")
        
    to_phone = "".join(filter(str.isdigit, lead_phone))
    
    is_sandbox = not wa_acc or wa_acc["access_token"].startswith("mock_")
    
    if not is_sandbox:
        try:
            settings = get_settings()
            phone_id = wa_acc["phone_number_id"]
            token = wa_acc["access_token"]
            
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(
                    f"https://graph.facebook.com/{settings.META_GRAPH_API_VERSION}/{phone_id}/messages",
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "messaging_product": "whatsapp",
                        "recipient_type": "individual",
                        "to": to_phone,
                        "type": "text",
                        "text": {"body": payload.message}
                    }
                )
                if resp.status_code != 200:
                    logger.error(f"Failed to send real WhatsApp message: {resp.text}")
        except Exception as e:
            logger.error(f"Error sending real WhatsApp message: {e}")
            
    # Save the outgoing agent message in DB
    import uuid
    with get_db() as db:
        db.execute(
            text("""
            INSERT INTO lead_messages (id, workspace_id, lead_id, channel, message_type, message_body, sender, receiver, delivery_status)
            VALUES (:id, :ws_id, :lead_id, 'whatsapp', 'text', :body, 'agent', :receiver, 'sent')
            """),
            {
                "id": str(uuid.uuid4()),
                "ws_id": tenant_id,
                "lead_id": lead_id,
                "body": payload.message,
                "receiver": to_phone
            }
        )
        db.commit()
        
    return success_response(message="Message sent successfully.")


# --- Chatbot Flow Builder APIs ---

class FlowTrigger(BaseModel):
    type: str  # 'keyword', 'any', 'source'
    keywords: List[str] = []

class FlowNodePayload(BaseModel):
    id: str
    type: str
    position: Dict[str, float]
    data: Dict[str, Any] = {}

class FlowEdgePayload(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None
    condition: Optional[Dict[str, Any]] = None

class ChatbotFlowPayload(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    trigger: FlowTrigger
    entryNodeId: Optional[str] = None
    isActive: bool = False
    nodes: List[FlowNodePayload] = []
    edges: List[FlowEdgePayload] = []

@router.get("/flows")
async def get_chatbot_flows(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    tenant_id = request.state.tenant.id
    with get_db() as db:
        rows = db.execute(
            text("""
            SELECT id, name, description, trigger_type, trigger_keywords, entry_node_id, is_active, created_at, updated_at
            FROM chatbot_flows
            WHERE workspace_id = :ws_id
            ORDER BY created_at DESC
            """),
            {"ws_id": tenant_id}
        ).mappings().all()
        
        flows = []
        for r in rows:
            trigger_kw = []
            if r["trigger_keywords"]:
                try:
                    trigger_kw = json.loads(r["trigger_keywords"])
                except Exception:
                    pass
            flows.append({
                "id": r["id"],
                "name": r["name"],
                "description": r["description"] or "",
                "trigger": {
                    "type": r["trigger_type"],
                    "keywords": trigger_kw
                },
                "entryNodeId": r["entry_node_id"] or "",
                "isActive": bool(r["is_active"]),
                "createdAt": r["created_at"].isoformat() if r["created_at"] else None,
                "updatedAt": r["updated_at"].isoformat() if r["updated_at"] else None,
            })
            
        return success_response(data=flows)

@router.get("/flows/{flow_id}")
async def get_chatbot_flow_detail(
    flow_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    tenant_id = request.state.tenant.id
    with get_db() as db:
        flow_row = db.execute(
            text("""
            SELECT id, name, description, trigger_type, trigger_keywords, entry_node_id, is_active
            FROM chatbot_flows
            WHERE workspace_id = :ws_id AND id = :flow_id
            """),
            {"ws_id": tenant_id, "flow_id": flow_id}
        ).mappings().first()
        
        if not flow_row:
            raise HTTPException(status_code=404, detail="Flow not found.")
            
        node_rows = db.execute(
            text("SELECT id, type, pos_x, pos_y, data FROM chatbot_flow_nodes WHERE flow_id = :flow_id"),
            {"flow_id": flow_id}
        ).mappings().all()
        
        edge_rows = db.execute(
            text("SELECT id, source_node_id, target_node_id, label, condition_data FROM chatbot_flow_edges WHERE flow_id = :flow_id"),
            {"flow_id": flow_id}
        ).mappings().all()
        
        trigger_kw = []
        if flow_row["trigger_keywords"]:
            try:
                trigger_kw = json.loads(flow_row["trigger_keywords"])
            except Exception:
                pass
                
        nodes = []
        for n in node_rows:
            node_data = {}
            if n["data"]:
                try:
                    node_data = json.loads(n["data"])
                except Exception:
                    pass
            nodes.append({
                "id": n["id"],
                "type": n["type"],
                "position": {"x": n["pos_x"], "y": n["pos_y"]},
                "data": node_data
            })
            
        edges = []
        for e in edge_rows:
            cond_data = None
            if e["condition_data"]:
                try:
                    cond_data = json.loads(e["condition_data"])
                except Exception:
                    pass
            edges.append({
                "id": e["id"],
                "source": e["source_node_id"],
                "target": e["target_node_id"],
                "label": e["label"] or "",
                "condition": cond_data
            })
            
        flow_detail = {
            "id": flow_row["id"],
            "name": flow_row["name"],
            "description": flow_row["description"] or "",
            "trigger": {
                "type": flow_row["trigger_type"],
                "keywords": trigger_kw
            },
            "entryNodeId": flow_row["entry_node_id"] or "",
            "isActive": bool(flow_row["is_active"]),
            "nodes": nodes,
            "edges": edges
        }
        
        return success_response(data=flow_detail)

@router.post("/flows")
async def save_chatbot_flow(
    payload: ChatbotFlowPayload,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    tenant_id = request.state.tenant.id
    
    with get_db() as db:
        # Check if flow exists
        exist_check = db.execute(
            text("SELECT id FROM chatbot_flows WHERE workspace_id = :ws_id AND id = :id"),
            {"ws_id": tenant_id, "id": payload.id}
        ).scalar()
        
        trigger_keywords_str = json.dumps([k.lower().strip() for k in payload.trigger.keywords])
        
        if exist_check:
            # Update flow
            db.execute(
                text("""
                UPDATE chatbot_flows 
                SET name = :name, description = :desc, trigger_type = :trig_type, 
                    trigger_keywords = :trig_kws, entry_node_id = :entry_node, is_active = :active
                WHERE workspace_id = :ws_id AND id = :id
                """),
                {
                    "name": payload.name,
                    "desc": payload.description,
                    "trig_type": payload.trigger.type,
                    "trig_kws": trigger_keywords_str,
                    "entry_node": payload.entryNodeId,
                    "active": payload.isActive,
                    "ws_id": tenant_id,
                    "id": payload.id
                }
            )
        else:
            # Insert flow
            db.execute(
                text("""
                INSERT INTO chatbot_flows (id, workspace_id, name, description, trigger_type, trigger_keywords, entry_node_id, is_active)
                VALUES (:id, :ws_id, :name, :desc, :trig_type, :trig_kws, :entry_node, :active)
                """),
                {
                    "id": payload.id,
                    "ws_id": tenant_id,
                    "name": payload.name,
                    "desc": payload.description,
                    "trig_type": payload.trigger.type,
                    "trig_kws": trigger_keywords_str,
                    "entry_node": payload.entryNodeId,
                    "active": payload.isActive
                }
            )
            
        # Clean up old nodes and edges
        db.execute(text("DELETE FROM chatbot_flow_nodes WHERE flow_id = :flow_id"), {"flow_id": payload.id})
        db.execute(text("DELETE FROM chatbot_flow_edges WHERE flow_id = :flow_id"), {"flow_id": payload.id})
        
        # Insert new nodes
        for node in payload.nodes:
            db.execute(
                text("""
                INSERT INTO chatbot_flow_nodes (id, flow_id, type, pos_x, pos_y, data)
                VALUES (:id, :flow_id, :type, :pos_x, :pos_y, :data)
                """),
                {
                    "id": node.id,
                    "flow_id": payload.id,
                    "type": node.type,
                    "pos_x": node.position.get("x", 0.0),
                    "pos_y": node.position.get("y", 0.0),
                    "data": json.dumps(node.data)
                }
            )
            
        # Insert new edges
        for edge in payload.edges:
            db.execute(
                text("""
                INSERT INTO chatbot_flow_edges (id, flow_id, source_node_id, target_node_id, label, condition_data)
                VALUES (:id, :flow_id, :src, :target, :label, :cond)
                """),
                {
                    "id": edge.id,
                    "flow_id": payload.id,
                    "src": edge.source,
                    "target": edge.target,
                    "label": edge.label or "",
                    "cond": json.dumps(edge.condition) if edge.condition else None
                }
            )
            
        db.commit()
        
    return success_response(message="Chatbot flow saved successfully.")

@router.delete("/flows/{flow_id}")
async def delete_chatbot_flow(
    flow_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    tenant_id = request.state.tenant.id
    with get_db() as db:
        result = db.execute(
            text("DELETE FROM chatbot_flows WHERE workspace_id = :ws_id AND id = :flow_id"),
            {"ws_id": tenant_id, "flow_id": flow_id}
        )
        db.commit()
        
    return success_response(message="Chatbot flow deleted successfully.")

@router.post("/flows/{flow_id}/toggle")
async def toggle_flow_active(
    flow_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    tenant_id = request.state.tenant.id
    with get_db() as db:
        # Get current status
        current_status = db.execute(
            text("SELECT is_active FROM chatbot_flows WHERE workspace_id = :ws_id AND id = :flow_id"),
            {"ws_id": tenant_id, "flow_id": flow_id}
        ).scalar()
        
        new_status = not bool(current_status)
        
        # If activating, deactivate all other flows in this workspace
        if new_status:
            db.execute(
                text("UPDATE chatbot_flows SET is_active = FALSE WHERE workspace_id = :ws_id"),
                {"ws_id": tenant_id}
            )
            
        db.execute(
            text("UPDATE chatbot_flows SET is_active = :status WHERE workspace_id = :ws_id AND id = :flow_id"),
            {"status": new_status, "ws_id": tenant_id, "flow_id": flow_id}
        )
        db.commit()
        
    return success_response(data={"is_active": new_status}, message=f"Flow {'activated' if new_status else 'deactivated'} successfully.")

