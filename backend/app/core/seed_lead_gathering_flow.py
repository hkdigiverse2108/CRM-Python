import os
import sys
import json
import uuid
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import text

# Resolve root .env path relative to this script
ENV_PATH = Path(__file__).resolve().parent.parent.parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

# Add project root to path to allow imports
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
sys.path.append(PROJECT_ROOT)

from backend.app.core.database import get_db

def seed_lead_gathering_workflows():
    print("=" * 60)
    print("   Seeding WhatsApp Lead Gathering Chatbot Workflow Template")
    print("=" * 60)

    with get_db() as db:
        # Get all workspaces
        workspaces = db.execute(text("SELECT workspace_id, workspace_name FROM workspaces")).all()
        if not workspaces:
            print("[!] No workspaces found in database. Please run database init first.")
            return

        for ws in workspaces:
            ws_id = ws[0]
            ws_name = ws[1]
            print(f"\n[*] Seeding Lead Gathering Flow for Workspace: '{ws_name}' ({ws_id})")

            flow_id = f"lead_gathering_flow_{ws_id[:8]}"
            flow_name = "WhatsApp Lead Qualification & Gathering"
            flow_desc = "Auto-triggers on incoming message, gathers name, email, company, and requirements, maps them to CRM Lead columns, and transfers to a human agent."

            # Delete any existing flow with this ID or name for this workspace
            db.execute(
                text("DELETE FROM chatbot_flow_edges WHERE flow_id = :flow_id"),
                {"flow_id": flow_id}
            )
            db.execute(
                text("DELETE FROM chatbot_flow_nodes WHERE flow_id = :flow_id"),
                {"flow_id": flow_id}
            )
            db.execute(
                text("DELETE FROM chatbot_flows WHERE workspace_id = :ws_id AND id = :flow_id"),
                {"ws_id": ws_id, "flow_id": flow_id}
            )

            # Insert Flow header
            # trigger_type = 'any' so it triggers on any incoming message if the lead has no active conversation session
            db.execute(
                text("""
                INSERT INTO chatbot_flows (id, workspace_id, name, description, trigger_type, trigger_keywords, entry_node_id, is_active, created_at, updated_at)
                VALUES (:id, :ws_id, :name, :desc, 'any', '[]', 'welcome_name', TRUE, NOW(), NOW())
                """),
                {
                    "id": flow_id,
                    "ws_id": ws_id,
                    "name": flow_name,
                    "desc": flow_desc
                }
            )

            # Nodes definitions
            nodes = [
                {
                    "id": "welcome_name",
                    "type": "question",
                    "pos_x": 150.0,
                    "pos_y": 200.0,
                    "data": {
                        "variable": "name",
                        "message": {
                            "text": "Hello! Welcome to our WhatsApp Assistant. How can we help you today? First, could you please tell me your full name?"
                        }
                    }
                },
                {
                    "id": "ask_email",
                    "type": "question",
                    "pos_x": 450.0,
                    "pos_y": 200.0,
                    "data": {
                        "variable": "email",
                        "message": {
                            "text": "Nice to meet you, ${name}! Could you please share your business or personal email address so we can send you relevant information?"
                        }
                    }
                },
                {
                    "id": "ask_company",
                    "type": "question",
                    "pos_x": 750.0,
                    "pos_y": 200.0,
                    "data": {
                        "variable": "company",
                        "message": {
                            "text": "Thank you. What is the name of your company or organization?"
                        }
                    }
                },
                {
                    "id": "ask_budget",
                    "type": "question",
                    "pos_x": 1050.0,
                    "pos_y": 200.0,
                    "data": {
                        "variable": "budget",
                        "message": {
                            "text": "Understood. What is your estimated budget or expected deal value in Rs?"
                        }
                    }
                },
                {
                    "id": "ask_requirements",
                    "type": "question",
                    "pos_x": 1350.0,
                    "pos_y": 200.0,
                    "data": {
                        "variable": "project_desc",
                        "message": {
                            "text": "Got it! Lastly, please describe your requirements or what services you are looking for."
                        }
                    }
                },
                {
                    "id": "thank_you",
                    "type": "message",
                    "pos_x": 1650.0,
                    "pos_y": 200.0,
                    "data": {
                        "message": {
                            "text": "Thank you so much, ${name}! We have successfully logged your details. One of our experts will get back to you shortly at ${email} or on this WhatsApp number."
                        }
                    }
                },
                {
                    "id": "human_handoff",
                    "type": "handoff",
                    "pos_x": 1950.0,
                    "pos_y": 200.0,
                    "data": {}
                }
            ]

            # Insert Nodes
            for n in nodes:
                db.execute(
                    text("""
                    INSERT INTO chatbot_flow_nodes (id, flow_id, type, pos_x, pos_y, data)
                    VALUES (:id, :flow_id, :type, :pos_x, :pos_y, :data)
                    """),
                    {
                        "id": n["id"],
                        "flow_id": flow_id,
                        "type": n["type"],
                        "pos_x": n["pos_x"],
                        "pos_y": n["pos_y"],
                        "data": json.dumps(n["data"])
                    }
                )

            # Edges definitions
            edges = [
                {"id": f"edge_1_{ws_id[:4]}", "source": "welcome_name", "target": "ask_email"},
                {"id": f"edge_2_{ws_id[:4]}", "source": "ask_email", "target": "ask_company"},
                {"id": f"edge_3_{ws_id[:4]}", "source": "ask_company", "target": "ask_budget"},
                {"id": f"edge_4_{ws_id[:4]}", "source": "ask_budget", "target": "ask_requirements"},
                {"id": f"edge_5_{ws_id[:4]}", "source": "ask_requirements", "target": "thank_you"},
                {"id": f"edge_6_{ws_id[:4]}", "source": "thank_you", "target": "human_handoff"}
            ]

            # Insert Edges
            for e in edges:
                db.execute(
                    text("""
                    INSERT INTO chatbot_flow_edges (id, flow_id, source_node_id, target_node_id, label, condition_data)
                    VALUES (:id, :flow_id, :src, :target, '', NULL)
                    """),
                    {
                        "id": e["id"],
                        "flow_id": flow_id,
                        "src": e["source"],
                        "target": e["target"]
                    }
                )

            print(f"[+] Lead Gathering Workflow created successfully for workspace: '{ws_name}'!")
            print(f"    - Flow ID: {flow_id}")
            print(f"    - Trigger Type: 'any' (activates automatically on incoming messages)")
            print(f"    - Data collected: 'name' -> Lead Name, 'email' -> Lead Email, 'company' -> Lead Company, 'project_desc' -> Lead Note.")

        db.commit()
        print("\n[OK] Seeding completed successfully.")

if __name__ == "__main__":
    seed_lead_gathering_workflows()
