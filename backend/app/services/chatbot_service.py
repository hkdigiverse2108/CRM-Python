import logging
import json
import re
import asyncio
from datetime import datetime, timedelta, timezone
from sqlalchemy import text
from typing import Optional, Dict, Any

from backend.app.core.database import get_db
from backend.app.core.config import get_settings

logger = logging.getLogger("chatbot_service")

# In-memory deduplication cache in case Redis is not running
MEM_DEDUPLICATION_CACHE = {}

def is_duplicate_message(wamid: str) -> bool:
    """
    Check if the message was already processed in the last 120 seconds.
    Tries Redis first, falls back to an in-memory cache.
    """
    if not wamid:
        return False
        
    now = datetime.utcnow()
    # Clean up old memory cache entries
    expired = [k for k, v in MEM_DEDUPLICATION_CACHE.items() if v < now - timedelta(seconds=120)]
    for k in expired:
        MEM_DEDUPLICATION_CACHE.pop(k, None)
        
    # Check memory cache
    if wamid in MEM_DEDUPLICATION_CACHE:
        return True
        
    MEM_DEDUPLICATION_CACHE[wamid] = now
    
    # Try Redis if configured
    settings = get_settings()
    try:
        import redis  # type: ignore
        # Simple redis check
        r = redis.Redis.from_url(settings.redis_url or "redis://localhost:6379/0", socket_timeout=2)
        key = f"wa_msg_dup:{wamid}"
        if r.exists(key):
            return True
        r.setex(key, 120, "1")
    except Exception as e:
        # Silently fall back to in-memory check
        pass
        
    return False

def interpolate_text(text_template: str, variables: Dict[str, Any]) -> str:
    """Interpolates variables formatted as ${variable_name} in text."""
    if not text_template:
        return ""
    
    def replacer(match):
        var_name = match.group(1)
        return str(variables.get(var_name, f"${{{var_name}}}"))
        
    return re.sub(r"\$\{([^}]+)\}", replacer, text_template)

def validate_input(val: str, var_name: str) -> bool:
    """Validates user input formats based on variable names."""
    if not val:
        return False
    val = val.strip()
    
    var_name_lower = var_name.lower()
    
    # Phone number validation
    if "phone" in var_name_lower or "mobile" in var_name_lower:
        # Allow numbers, optional leading plus, length 7 to 15
        return bool(re.match(r"^\+?[0-9]{7,15}$", val))
        
    # Email validation
    if "email" in var_name_lower:
        return bool(re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", val))
        
    # Date validation (e.g. YYYY-MM-DD or DD/MM/YYYY)
    if "date" in var_name_lower:
        date_patterns = [
            r"^\d{4}-\d{2}-\d{2}$",
            r"^\d{2}/\d{2}/\d{4}$",
            r"^\d{2}-\d{2}-\d{4}$"
        ]
        return any(bool(re.match(pat, val)) for pat in date_patterns)
        
    # Number validation
    if "number" in var_name_lower or "qty" in var_name_lower or "amount" in var_name_lower or "count" in var_name_lower:
        return bool(re.match(r"^\d+(\.\d+)?$", val))
        
    return True

async def send_whatsapp_message_via_api(tenant_id: str, to_phone: str, msg_payload: Dict[str, Any]):
    """Sends WhatsApp message utilizing workspace Meta account credentials."""
    logger.info(f"Sending WhatsApp message to {to_phone} for tenant {tenant_id}: {msg_payload}")
    
    settings = get_settings()
    phone_id = None
    access_token = None
    
    with get_db() as db:
        acc = db.execute(
            text("SELECT phone_number_id, access_token FROM whatsapp_accounts WHERE tenant_id = :tenant_id LIMIT 1"),
            {"tenant_id": tenant_id}
        ).mappings().first()
        if acc:
            phone_id = acc["phone_number_id"]
            access_token = acc["access_token"]
            
    if not phone_id or not access_token or access_token.startswith("mock_"):
        # Sandbox / Mock Mode
        logger.info(f"[MOCK WHATSAPP SEND] To: {to_phone}, Payload: {msg_payload}")
    else:
        # Real Meta API Call
        import httpx
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(
                    f"https://graph.facebook.com/{settings.META_GRAPH_API_VERSION}/{phone_id}/messages",
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "messaging_product": "whatsapp",
                        "recipient_type": "individual",
                        "to": to_phone,
                        **msg_payload
                    }
                )
                if resp.status_code != 200:
                    logger.error(f"Meta API Send message error: {resp.text}")
        except Exception as e:
            logger.error(f"Error calling Meta API to send message: {e}")

    # Centralized DB logging for outgoing bot replies
    try:
        with get_db() as db:
            lead_id = db.execute(
                text("SELECT lead_id FROM leads WHERE workspace_id = :ws_id AND phone_primary = :phone AND deleted_at IS NULL LIMIT 1"),
                {"ws_id": tenant_id, "phone": to_phone}
            ).scalar()
            
            if lead_id:
                body = ""
                if msg_payload.get("type") == "text":
                    body = msg_payload.get("text", {}).get("body", "")
                elif msg_payload.get("type") == "image":
                    caption = msg_payload.get("image", {}).get("caption", "")
                    link = msg_payload.get("image", {}).get("link", "")
                    body = f"[Image Link: {link}] {caption}" if link else caption
                    
                db.execute(
                    text("""
                    INSERT INTO lead_messages (id, workspace_id, lead_id, channel, message_type, message_body, sender, receiver, delivery_status, message_time, created_at)
                    VALUES (:id, :ws_id, :lead_id, 'whatsapp', 'text', :body, 'bot', :receiver, 'sent', NOW(), NOW())
                    """),
                    {
                        "id": f"wamid.OUT_{uuid_uuid4()}",
                        "ws_id": tenant_id,
                        "lead_id": lead_id,
                        "body": body,
                        "receiver": to_phone
                    }
                )
                db.commit()
    except Exception as db_err:
        logger.error(f"Failed to log outgoing chatbot message in DB: {db_err}")

async def evaluate_flow_node(
    tenant_id: str, 
    lead_id: str, 
    phone: str, 
    user_input: Optional[str], 
    flow_id: str, 
    node_id: str, 
    variables: Dict[str, Any],
    db
) -> tuple[Optional[str], Optional[str], str]:  # Returns (next_node_id, next_status, message_to_log)
    """Evaluates a single node's action and determines the next node and status."""
    
    # 1. Fetch Node Definition
    node = db.execute(
        text("SELECT type, data FROM chatbot_flow_nodes WHERE flow_id = :flow_id AND id = :node_id LIMIT 1"),
        {"flow_id": flow_id, "node_id": node_id}
    ).mappings().first()
    
    if not node:
        logger.warning(f"Node {node_id} not found in flow {flow_id}.")
        return None, "bot", ""
        
    node_type = node["type"]
    node_data = json.loads(node["data"]) if node["data"] else {}
    
    logger.info(f"Evaluating Node {node_id} [{node_type}] for Lead {lead_id} in Flow {flow_id}.")
    
    if node_type == "message":
        text_template = node_data.get("message", {}).get("text", "")
        media_url = node_data.get("message", {}).get("image", "")
        
        body_text = interpolate_text(text_template, variables)
        
        # Build payload
        if media_url:
            msg_payload = {
                "type": "image",
                "image": {
                    "link": media_url,
                    "caption": body_text
                }
            }
        else:
            msg_payload = {
                "type": "text",
                "text": {"body": body_text}
            }
            
        await send_whatsapp_message_via_api(tenant_id, phone, msg_payload)
        
        # Move to next node connected by edge
        next_node = db.execute(
            text("SELECT target_node_id FROM chatbot_flow_edges WHERE flow_id = :flow_id AND source_node_id = :node_id LIMIT 1"),
            {"flow_id": flow_id, "node_id": node_id}
        ).scalar()
        
        return next_node, "bot", body_text

    elif node_type == "question":
        var_name = node_data.get("variable", "answer")
        
        # If user_input is provided, we evaluate the reply
        if user_input is not None:
            # Validate input format
            is_valid = validate_input(user_input, var_name)
            if is_valid:
                variables[var_name] = user_input.strip()
                # Find outgoing edge
                next_node = db.execute(
                    text("SELECT target_node_id FROM chatbot_flow_edges WHERE flow_id = :flow_id AND source_node_id = :node_id LIMIT 1"),
                    {"flow_id": flow_id, "node_id": node_id}
                ).scalar()
                return next_node, "bot", ""
            else:
                # Validation failed, repeat question
                err_text = f"Invalid format for {var_name}. Please re-enter."
                await send_whatsapp_message_via_api(tenant_id, phone, {
                    "type": "text",
                    "text": {"body": err_text}
                })
                # Re-send original question
                text_template = node_data.get("message", {}).get("text", "Please respond:")
                body_text = interpolate_text(text_template, variables)
                await send_whatsapp_message_via_api(tenant_id, phone, {
                    "type": "text",
                    "text": {"body": body_text}
                })
                return node_id, "waiting", ""
        else:
            # First time entering question, send the prompt
            text_template = node_data.get("message", {}).get("text", "Please respond:")
            body_text = interpolate_text(text_template, variables)
            await send_whatsapp_message_via_api(tenant_id, phone, {
                "type": "text",
                "text": {"body": body_text}
            })
            return node_id, "waiting", body_text

    elif node_type == "condition":
        cond = node_data.get("condition", {})
        c_var = cond.get("variable", "")
        c_op = cond.get("operator", "equals")
        c_val = str(cond.get("value", "")).lower().strip()
        
        var_val = str(variables.get(c_var, "")).lower().strip()
        
        # Evaluate condition
        result = False
        if c_op == "equals":
            result = (var_val == c_val)
        elif c_op == "contains":
            result = (c_val in var_val)
        elif c_op == "not_equals":
            result = (var_val != c_val)
        elif c_op == "exists":
            result = (c_var in variables and bool(variables[c_var]))
            
        edge_label = "True" if result else "False"
        
        next_node = db.execute(
            text("""
            SELECT target_node_id FROM chatbot_flow_edges 
            WHERE flow_id = :flow_id AND source_node_id = :node_id AND label = :label 
            LIMIT 1
            """),
            {"flow_id": flow_id, "node_id": node_id, "label": edge_label}
        ).scalar()
        
        # If specific True/False edge is not found, fallback to any edge
        if not next_node:
            next_node = db.execute(
                text("SELECT target_node_id FROM chatbot_flow_edges WHERE flow_id = :flow_id AND source_node_id = :node_id LIMIT 1"),
                {"flow_id": flow_id, "node_id": node_id}
            ).scalar()
            
        return next_node, "bot", ""

    elif node_type == "ai":
        prompt = node_data.get("aiPrompt", "Converse helpfully with the client.")
        
        # Call LLM logic
        response_text = "Thank you for reaching out! Let me check that for you."
        
        # Dynamic LLM calling simulation (e.g. OpenAI / Grok)
        if user_input:
            response_text = await generate_ai_response(prompt, user_msg=user_input, lead_id=lead_id, tenant_id=tenant_id)
            
        await send_whatsapp_message_via_api(tenant_id, phone, {
            "type": "text",
            "text": {"body": response_text}
        })
        
        # Check if conversation is finished
        if "finished" in response_text.lower() or (user_input and "finish" in user_input.lower()):
            next_node = db.execute(
                text("SELECT target_node_id FROM chatbot_flow_edges WHERE flow_id = :flow_id AND source_node_id = :node_id LIMIT 1"),
                {"flow_id": flow_id, "node_id": node_id}
            ).scalar()
            return next_node, "bot", response_text
        else:
            return node_id, "ai", response_text

    elif node_type == "delay":
        delay_sec = int(node_data.get("delaySeconds", 2))
        # Wait/sleep non-blocking for short delays
        if delay_sec > 0:
            await asyncio.sleep(min(delay_sec, 5))
            
        next_node = db.execute(
            text("SELECT target_node_id FROM chatbot_flow_edges WHERE flow_id = :flow_id AND source_node_id = :node_id LIMIT 1"),
            {"flow_id": flow_id, "node_id": node_id}
        ).scalar()
        return next_node, "bot", ""

    elif node_type == "handoff":
        # Handoff to human
        # Send transfer alert
        transfer_msg = "🤝 Transferring conversation to a human support agent..."
        await send_whatsapp_message_via_api(tenant_id, phone, {
            "type": "text",
            "text": {"body": transfer_msg}
        })
        return None, "human", transfer_msg

    return None, "bot", ""

async def generate_ai_response(system_prompt: str, user_msg: str, lead_id: str, tenant_id: str) -> str:
    """Mock/Simulated LLM call using the system prompt and history context."""
    user_msg_lower = user_msg.lower()
    if "help" in user_msg_lower or "support" in user_msg_lower:
        return "I can definitely help you with support. What is the issue you are facing? Type 'exit' or 'FINISHED' when you are done."
    if "done" in user_msg_lower or "exit" in user_msg_lower or "finished" in user_msg_lower:
        return "Perfect! Flow FINISHED. Connecting you back."
    return f"AI Responder: I received your request. Regarding your message: '{user_msg}', let me know if you need anything else or type 'FINISHED' to exit."

def uuid_uuid4():
    import uuid
    return str(uuid.uuid4())

async def run_chatbot_flow_engine(tenant_id: str, phone: str, text_body: str, db):
    """
    Evaluates the current state of the conversation and advances the flow
    through the state machine nodes.
    """
    # 1. Fetch Lead ID
    lead = db.execute(
        text("SELECT lead_id, full_name FROM leads WHERE workspace_id = :ws_id AND phone_primary = :phone AND deleted_at IS NULL LIMIT 1"),
        {"ws_id": tenant_id, "phone": phone}
    ).mappings().first()
    
    if not lead:
        return
        
    lead_id = lead["lead_id"]
    lead_name = lead["full_name"]
    
    # 2. Get Lead Conversation State
    state = db.execute(
        text("SELECT current_flow_id, current_node_id, flow_variables, status, last_message_at FROM lead_conversation_states WHERE lead_id = :lead_id LIMIT 1"),
        {"lead_id": lead_id}
    ).mappings().first()
    
    now = datetime.utcnow()
    
    # Defaults
    flow_id = None
    node_id = None
    variables = {"name": lead_name, "phone": phone}
    status = "bot"
    
    if state:
        flow_id = state["current_flow_id"]
        node_id = state["current_node_id"]
        status = state["status"]
        
        # Load variables
        if state["flow_variables"]:
            try:
                variables.update(json.loads(state["flow_variables"]))
            except Exception:
                pass
                
        # Check Session Timeout (1 Hour expiry)
        last_msg = state["last_message_at"]
        if last_msg and (now - last_msg) > timedelta(hours=1):
            logger.info(f"Session expired for Lead {lead_id} (last active {last_msg}). Resetting state.")
            flow_id = None
            node_id = None
            variables = {"name": lead_name, "phone": phone}
            status = "bot"
            
    if status == "human":
        # Conversation is locked by a human agent, bypass chatbot evaluation
        return
        
    # 3. Check Triggers if no active flow
    if not flow_id:
        # Fetch active flows in workspace
        active_flows = db.execute(
            text("SELECT id, entry_node_id, trigger_type, trigger_keywords FROM chatbot_flows WHERE workspace_id = :ws_id AND is_active = TRUE"),
            {"ws_id": tenant_id}
        ).mappings().all()
        
        matched_flow = None
        for flow in active_flows:
            t_type = flow["trigger_type"]
            if t_type == "any":
                matched_flow = flow
                break
            elif t_type == "keyword" and flow["trigger_keywords"]:
                try:
                    kws = json.loads(flow["trigger_keywords"])
                    if text_body.lower().strip() in [k.lower().strip() for k in kws]:
                        matched_flow = flow
                        break
                except Exception:
                    pass
                    
        if matched_flow:
            flow_id = matched_flow["id"]
            node_id = matched_flow["entry_node_id"]
            status = "bot"
            logger.info(f"Triggered Flow {flow_id} via trigger: {text_body} for Lead {lead_id}")
        else:
            # No matching active flow triggers
            return
            
    # 4. State Machine Evaluation Loop
    max_steps = 10  # Prevent infinite loops in poorly designed flows
    step = 0
    curr_input = text_body
    
    while node_id and step < max_steps:
        step += 1
        
        # Evaluate current node
        next_node, next_status, msg_logged = await evaluate_flow_node(
            tenant_id=tenant_id,
            lead_id=lead_id,
            phone=phone,
            user_input=curr_input if status in ("waiting", "ai") else None,
            flow_id=flow_id,
            node_id=node_id,
            variables=variables,
            db=db
        )
        
        # Reset input so subsequent nodes in same webhook execution don't consume it
        curr_input = None
        node_id = next_node
        status = next_status
        
        # Break execution loop if waiting for user input, handoff to human, or flow ends
        if status in ("waiting", "ai", "human") or not node_id:
            break
            
    # 5. Persist Session State
    if state:
        db.execute(
            text("""
            UPDATE lead_conversation_states
            SET current_flow_id = :flow_id, current_node_id = :node_id, 
                flow_variables = :vars, status = :status, last_message_at = :now
            WHERE lead_id = :lead_id
            """),
            {
                "flow_id": flow_id,
                "node_id": node_id,
                "vars": json.dumps(variables),
                "status": status,
                "now": now,
                "lead_id": lead_id
            }
        )
    else:
        db.execute(
            text("""
            INSERT INTO lead_conversation_states (lead_id, workspace_id, current_flow_id, current_node_id, flow_variables, status, last_message_at)
            VALUES (:lead_id, :ws_id, :flow_id, :node_id, :vars, :status, :now)
            """),
            {
                "lead_id": lead_id,
                "ws_id": tenant_id,
                "flow_id": flow_id,
                "node_id": node_id,
                "vars": json.dumps(variables),
                "status": status,
                "now": now
            }
        )

    # 6. Real-time mapping of gathered flow variables to CRM lead columns
    try:
        email_val = variables.get("user_email") or variables.get("email")
        company_val = variables.get("company") or variables.get("company_name")
        name_val = variables.get("name") or variables.get("full_name")
        notes_val = variables.get("project_desc") or variables.get("notes") or variables.get("requirements")
        
        update_parts = []
        params = {"lead_id": lead_id, "workspace_id": tenant_id}
        
        if email_val:
            update_parts.append("email = :email")
            params["email"] = email_val
        if company_val:
            update_parts.append("company_name = :company")
            params["company"] = company_val
        if name_val and name_val != lead_name:
            update_parts.append("full_name = :name")
            params["name"] = name_val
            
        budget_val = variables.get("budget") or variables.get("value") or variables.get("deal_value") or variables.get("price")
        if budget_val:
            try:
                clean_num = "".join(c for c in str(budget_val) if c.isdigit() or c == ".")
                if clean_num:
                    params["deal_value_expected"] = float(clean_num)
                    update_parts.append("deal_value_expected = :deal_value_expected")
            except Exception as num_err:
                logger.warning(f"Failed to parse budget value '{budget_val}': {num_err}")

        product_interest_val = variables.get("product_interest") or variables.get("service") or variables.get("label") or variables.get("interest") or variables.get("product")
        if product_interest_val:
            product_interest_val = str(product_interest_val).strip()
            if product_interest_val:
                update_parts.append("product_interest = :product_interest")
                params["product_interest"] = product_interest_val
                
                # Auto-add label to workspace_lead_labels if not already existing
                try:
                    label_exists = db.execute(
                        text("SELECT id FROM workspace_lead_labels WHERE workspace_id = :ws_id AND label_name = :name LIMIT 1"),
                        {"ws_id": tenant_id, "name": product_interest_val}
                    ).scalar()
                    if not label_exists:
                        db.execute(
                            text("INSERT INTO workspace_lead_labels (id, workspace_id, label_name) VALUES (:id, :ws_id, :name)"),
                            {"id": uuid_uuid4(), "ws_id": tenant_id, "name": product_interest_val}
                        )
                except Exception as lbl_err:
                    logger.error(f"Failed to auto-add chatbot label '{product_interest_val}' to workspace_lead_labels: {lbl_err}")
            
        if update_parts:
            update_parts.append("updated_at = NOW()")
            sql_update_lead = f"UPDATE leads SET {', '.join(update_parts)} WHERE lead_id = :lead_id AND workspace_id = :workspace_id"
            db.execute(text(sql_update_lead), params)
            
        if notes_val:
            # Check if this note was already added to prevent duplicate notes
            note_exists = db.execute(
                text("SELECT id FROM lead_notes WHERE lead_id = :lead_id AND note = :note LIMIT 1"),
                {"lead_id": lead_id, "note": notes_val}
            ).scalar()
            if not note_exists:
                db.execute(
                    text("INSERT INTO lead_notes (id, workspace_id, lead_id, note) VALUES (:id, :workspace_id, :lead_id, :note)"),
                    {"id": uuid_uuid4(), "workspace_id": tenant_id, "lead_id": lead_id, "note": notes_val}
                )
    except Exception as update_err:
        logger.error(f"Failed to auto-update lead columns from chatbot variables: {update_err}")

    db.commit()
