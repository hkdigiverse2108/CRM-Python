import asyncio
import os
import sys
from sqlalchemy import text
from dotenv import load_dotenv

sys.path.append("c:/CRM")
load_dotenv("c:/CRM/.env")

from backend.app.core.database import get_db
from backend.app.services.chatbot_service import run_chatbot_flow_engine

async def simulate_gujarati_conversation():
    tenant_id = "96722"
    phone = "918780564463"
    
    # We will simulate a series of messages from the user for Gujarati:
    # 1. "hello" (to trigger the flow)
    # 2. "2" (to select Gujarati)
    # 3. "1" (to select Custom Software Dev in Gujarati)
    # 4. "વેબ પોર્ટલ બનાવવું છે" (Gujarati project description)
    # 5. "contact@hkdigiverse.com" (business email)
    
    steps = [
        "hello",
        "2",
        "1",
        "વેબ પોર્ટલ બનાવવું છે",
        "contact@hkdigiverse.com"
    ]
    
    print("=== Simulating Bilingual Chatbot Conversation (Gujarati Branch) ===")
    
    # Clean state first
    with get_db() as db:
        db.execute(text("DELETE FROM lead_conversation_states WHERE lead_id = (SELECT lead_id FROM leads WHERE workspace_id = :ws_id AND phone_primary = :phone AND deleted_at IS NULL LIMIT 1)"), {"ws_id": tenant_id, "phone": phone})
        db.execute(text("DELETE FROM lead_messages WHERE receiver = :phone or sender = :phone"), {"phone": phone})
        db.commit()
        print("Cleaned state for user.")

    for idx, msg in enumerate(steps, 1):
        print(f"\n--- User Step {idx}: Send message '{msg}' ---")
        with get_db() as db:
            state = db.execute(
                text("SELECT current_node_id, flow_variables, status FROM lead_conversation_states WHERE workspace_id = :ws_id LIMIT 1"),
                {"ws_id": tenant_id}
            ).mappings().first()
            if state:
                print(f"Current State before msg: Node ID: {state['current_node_id']}, Status: {state['status']}, Variables: {state['flow_variables']}")
            else:
                print("Current State before msg: No active conversation state")

            await run_chatbot_flow_engine(tenant_id, phone, msg, db)
            
            # Print outgoing messages logged for this user
            msgs = db.execute(
                text("SELECT message_body, sender, created_at FROM lead_messages WHERE workspace_id = :ws_id ORDER BY created_at DESC LIMIT 3"),
                {"ws_id": tenant_id}
            ).mappings().all()
            print("Recent logged messages:")
            for m in reversed(msgs):
                print(f"  [{m['sender'].upper()}] {m['message_body']}")

if __name__ == "__main__":
    asyncio.run(simulate_gujarati_conversation())
