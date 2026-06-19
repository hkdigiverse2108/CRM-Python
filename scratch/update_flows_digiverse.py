import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import json

load_dotenv(dotenv_path="c:/CRM/.env")

db_host = os.getenv("DB_HOST")
db_port = os.getenv("DB_PORT", "3306")
db_user = os.getenv("DB_USER")
db_pass = os.getenv("DB_PASS")
db_name = os.getenv("DB_NAME")

db_url = f"mysql+pymysql://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"

engine = create_engine(db_url)

flows_to_update = ["it_service_flow", "it_service_flow_71110"]

nodes = [
    # Language Selection
    {"id": "node_welcome", "type": "question", "pos_x": 100, "pos_y": 250, "data": {"message": {"text": "Welcome to HK Digiverse LLP! 🚀 Please select your language.\n\nHK Digiverse LLP માં આપનું સ્વાગત છે! 🚀 કૃપા કરીને તમારી ભાષા પસંદ કરો:\n\n1. English\n2. Gujarati"}, "variable": "user_lang"}},
    {"id": "node_cond_lang", "type": "condition", "pos_x": 350, "pos_y": 250, "data": {"condition": {"variable": "user_lang", "operator": "contains", "value": "2"}}},
    
    # English Branch
    {"id": "node_welcome_en", "type": "message", "pos_x": 600, "pos_y": 50, "data": {"message": {"text": "Thank you for choosing English! We help businesses scale with custom software development, cloud engineering, and cybersecurity."}}},
    {"id": "node_ask_service_en", "type": "question", "pos_x": 850, "pos_y": 50, "data": {"message": {"text": "Which service domain are you interested in today?\n\nPlease reply with the number:\n1. Custom Software Dev\n2. Cloud Migration / DevOps\n3. Cybersecurity Consulting"}, "variable": "interested_service"}},
    {"id": "node_cond_software_en", "type": "condition", "pos_x": 1100, "pos_y": 50, "data": {"condition": {"variable": "interested_service", "operator": "contains", "value": "1"}}},
    {"id": "node_ask_requirements_en", "type": "question", "pos_x": 1350, "pos_y": -50, "data": {"message": {"text": "Awesome! Please describe your software project briefly (e.g., mobile app, web portal, or custom integrations):"}, "variable": "project_desc"}},
    {"id": "node_cond_cloud_en", "type": "condition", "pos_x": 1350, "pos_y": 150, "data": {"condition": {"variable": "interested_service", "operator": "contains", "value": "2"}}},
    {"id": "node_ask_cloud_req_en", "type": "question", "pos_x": 1600, "pos_y": 100, "data": {"message": {"text": "Excellent! Are you looking for cloud migration, infrastructure orchestration (IaC), or managed server support? Please describe briefly:"}, "variable": "project_desc"}},
    {"id": "node_msg_other_en", "type": "message", "pos_x": 1600, "pos_y": 250, "data": {"message": {"text": "Got it! You are interested in Cyber Security or general IT consulting. Let's get your details to connect with our security analysts."}}},
    {"id": "node_ask_email_en", "type": "question", "pos_x": 1900, "pos_y": 50, "data": {"message": {"text": "To book your free consulting session, please enter your business email address:"}, "variable": "user_email"}},
    {"id": "node_msg_confirm_en", "type": "message", "pos_x": 2150, "pos_y": 50, "data": {"message": {"text": "Thank you! We have logged your request under ${user_email}. Our consulting team will reach out to schedule our session shortly."}}},

    # Gujarati Branch
    {"id": "node_welcome_gu", "type": "message", "pos_x": 600, "pos_y": 450, "data": {"message": {"text": "ગુજરાતી પસંદ કરવા બદલ આભાર! અમે કસ્ટમ સોફ્ટવેર ડેવલપમેન્ટ, ક્લાઉડ એન્જિનિયરિંગ અને સાયબર સિક્યોરિટી દ્વારા બિઝનેસ વધારવામાં મદદ કરીએ છીએ."}}},
    {"id": "node_ask_service_gu", "type": "question", "pos_x": 850, "pos_y": 450, "data": {"message": {"text": "તમે આજે કઈ સેવામાં રસ ધરાવો છો?\n\nકૃપા કરીને નંબર સાથે જવાબ આપો:\n1. કસ્ટમ સોફ્ટવેર ડેવલપમેન્ટ (Custom Software)\n2. ક્લાઉડ માઈગ્રેશન / ડેવઓપ્સ (Cloud Migration)\n3. સાયબર સિક્યોરિટી કન્સલ્ટિંગ (Cybersecurity)"}, "variable": "interested_service"}},
    {"id": "node_cond_software_gu", "type": "condition", "pos_x": 1100, "pos_y": 450, "data": {"condition": {"variable": "interested_service", "operator": "contains", "value": "1"}}},
    {"id": "node_ask_requirements_gu", "type": "question", "pos_x": 1350, "pos_y": 350, "data": {"message": {"text": "ખૂબ સરસ! કૃપા કરીને તમારા સોફ્ટવેર પ્રોજેક્ટ વિશે ટૂંકમાં જણાવો (દા.ત., મોબાઇલ એપ્લિકેશન, વેબ પોર્ટલ અથવા કસ્ટમ ઇન્ટિગ્રેશન):"}, "variable": "project_desc"}},
    {"id": "node_cond_cloud_gu", "type": "condition", "pos_x": 1350, "pos_y": 550, "data": {"condition": {"variable": "interested_service", "operator": "contains", "value": "2"}}},
    {"id": "node_ask_cloud_req_gu", "type": "question", "pos_x": 1600, "pos_y": 500, "data": {"message": {"text": "ઉત્તમ! શું તમે ક્લાઉડ માઈગ્રેશન, ઇન્ફ્રાસ્ટ્રક્ચર ઓર્કેસ્ટ્રેશન (IaC), અથવા સર્વર સપોર્ટ શોધી રહ્યા છો? કૃપા કરીને ટૂંકમાં જણાવો:"}, "variable": "project_desc"}},
    {"id": "node_msg_other_gu", "type": "message", "pos_x": 1600, "pos_y": 650, "data": {"message": {"text": "સમજી ગયા! તમને સાયબર સિક્યોરિટી અથવા સામાન્ય આઈટી કન્સલ્ટિંગમાં રસ છે. અમારા સિક્યોરિટી નિષ્ણાતો સાથે જોડાવા માટે તમારી વિગતો મેળવીએ."}}},
    {"id": "node_ask_email_gu", "type": "question", "pos_x": 1900, "pos_y": 450, "data": {"message": {"text": "તમારા ફ્રી કન્સલ્ટિંગ સેશન બુક કરવા માટે, કૃપા કરીને તમારું બિઝનેસ ઇમેઇલ આઈડી આપો:"}, "variable": "user_email"}},
    {"id": "node_msg_confirm_gu", "type": "message", "pos_x": 2150, "pos_y": 450, "data": {"message": {"text": "આભાર! અમે ${user_email} હેઠળ તમારી વિગતો નોંધી લીધી છે. અમારી ટીમ ટૂંક સમયમાં તમારો સંપર્ક કરશે."}}},

    # Handoff
    {"id": "node_handoff", "type": "handoff", "pos_x": 2450, "pos_y": 250, "data": {}}
]

edges = [
    # Language Router
    {"id": "edge_node_welcome_to_node_cond_lang", "source_node_id": "node_welcome", "target_node_id": "node_cond_lang", "label": ""},
    {"id": "edge_node_cond_lang_to_node_welcome_gu", "source_node_id": "node_cond_lang", "target_node_id": "node_welcome_gu", "label": "True"},
    {"id": "edge_node_cond_lang_to_node_welcome_en", "source_node_id": "node_cond_lang", "target_node_id": "node_welcome_en", "label": "False"},

    # English Branch Edges
    {"id": "edge_node_welcome_en_to_node_ask_service_en", "source_node_id": "node_welcome_en", "target_node_id": "node_ask_service_en", "label": ""},
    {"id": "edge_node_ask_service_en_to_node_cond_software_en", "source_node_id": "node_ask_service_en", "target_node_id": "node_cond_software_en", "label": ""},
    {"id": "edge_node_cond_software_en_to_node_ask_requirements_en", "source_node_id": "node_cond_software_en", "target_node_id": "node_ask_requirements_en", "label": "True"},
    {"id": "edge_node_cond_software_en_to_node_cond_cloud_en", "source_node_id": "node_cond_software_en", "target_node_id": "node_cond_cloud_en", "label": "False"},
    {"id": "edge_node_cond_cloud_en_to_node_ask_cloud_req_en", "source_node_id": "node_cond_cloud_en", "target_node_id": "node_ask_cloud_req_en", "label": "True"},
    {"id": "edge_node_cond_cloud_en_to_node_msg_other_en", "source_node_id": "node_cond_cloud_en", "target_node_id": "node_msg_other_en", "label": "False"},
    {"id": "edge_node_ask_requirements_en_to_node_ask_email_en", "source_node_id": "node_ask_requirements_en", "target_node_id": "node_ask_email_en", "label": ""},
    {"id": "edge_node_ask_cloud_req_en_to_node_ask_email_en", "source_node_id": "node_ask_cloud_req_en", "target_node_id": "node_ask_email_en", "label": ""},
    {"id": "edge_node_msg_other_en_to_node_ask_email_en", "source_node_id": "node_msg_other_en", "target_node_id": "node_ask_email_en", "label": ""},
    {"id": "edge_node_ask_email_en_to_node_msg_confirm_en", "source_node_id": "node_ask_email_en", "target_node_id": "node_msg_confirm_en", "label": ""},
    {"id": "edge_node_msg_confirm_en_to_node_handoff", "source_node_id": "node_msg_confirm_en", "target_node_id": "node_handoff", "label": ""},

    # Gujarati Branch Edges
    {"id": "edge_node_welcome_gu_to_node_ask_service_gu", "source_node_id": "node_welcome_gu", "target_node_id": "node_ask_service_gu", "label": ""},
    {"id": "edge_node_ask_service_gu_to_node_cond_software_gu", "source_node_id": "node_ask_service_gu", "target_node_id": "node_cond_software_gu", "label": ""},
    {"id": "edge_node_cond_software_gu_to_node_ask_requirements_gu", "source_node_id": "node_cond_software_gu", "target_node_id": "node_ask_requirements_gu", "label": "True"},
    {"id": "edge_node_cond_software_gu_to_node_cond_cloud_gu", "source_node_id": "node_cond_software_gu", "target_node_id": "node_cond_cloud_gu", "label": "False"},
    {"id": "edge_node_cond_cloud_gu_to_node_ask_cloud_req_gu", "source_node_id": "node_cond_cloud_gu", "target_node_id": "node_ask_cloud_req_gu", "label": "True"},
    {"id": "edge_node_cond_cloud_gu_to_node_msg_other_gu", "source_node_id": "node_cond_cloud_gu", "target_node_id": "node_msg_other_gu", "label": "False"},
    {"id": "edge_node_ask_requirements_gu_to_node_ask_email_gu", "source_node_id": "node_ask_requirements_gu", "target_node_id": "node_ask_email_gu", "label": ""},
    {"id": "edge_node_ask_cloud_req_gu_to_node_ask_email_gu", "source_node_id": "node_ask_cloud_req_gu", "target_node_id": "node_ask_email_gu", "label": ""},
    {"id": "edge_node_msg_other_gu_to_node_ask_email_gu", "source_node_id": "node_msg_other_gu", "target_node_id": "node_ask_email_gu", "label": ""},
    {"id": "edge_node_ask_email_gu_to_node_msg_confirm_gu", "source_node_id": "node_ask_email_gu", "target_node_id": "node_msg_confirm_gu", "label": ""},
    {"id": "edge_node_msg_confirm_gu_to_node_handoff", "source_node_id": "node_msg_confirm_gu", "target_node_id": "node_handoff", "label": ""}
]

try:
    with engine.begin() as conn:
        for flow_id in flows_to_update:
            # Update flow details
            conn.execute(
                text("UPDATE chatbot_flows SET name = :name, description = :desc, entry_node_id = 'node_welcome' WHERE id = :flow_id"),
                {
                    "name": "HK Digiverse LLP Services Consultation Router",
                    "desc": "Auto-qualifies inquiries in English and Gujarati for Software, Cloud, & Security, collects business emails, and hands off to live consultants.",
                    "flow_id": flow_id
                }
            )
            # Delete old nodes & edges
            conn.execute(text("DELETE FROM chatbot_flow_edges WHERE flow_id = :flow_id"), {"flow_id": flow_id})
            conn.execute(text("DELETE FROM chatbot_flow_nodes WHERE flow_id = :flow_id"), {"flow_id": flow_id})
            
            # Insert new nodes
            for n in nodes:
                conn.execute(
                    text("INSERT INTO chatbot_flow_nodes (id, flow_id, type, pos_x, pos_y, data) VALUES (:id, :flow_id, :type, :pos_x, :pos_y, :data)"),
                    {
                        "id": n["id"],
                        "flow_id": flow_id,
                        "type": n["type"],
                        "pos_x": n["pos_x"],
                        "pos_y": n["pos_y"],
                        "data": json.dumps(n["data"])
                    }
                )
            
            # Insert new edges
            for e in edges:
                conn.execute(
                    text("INSERT INTO chatbot_flow_edges (id, flow_id, source_node_id, target_node_id, label, condition_data) VALUES (:id, :flow_id, :source, :target, :label, NULL)"),
                    {
                        "id": e["id"],
                        "flow_id": flow_id,
                        "source": e["source_node_id"],
                        "target": e["target_node_id"],
                        "label": e["label"]
                    }
                )
            print(f"Updated flow: {flow_id} successfully.")
            
        # Reset existing session states so testing starts clean
        conn.execute(text("DELETE FROM lead_conversation_states"))
        print("Cleared lead_conversation_states for clean testing.")
except Exception as ex:
    print(f"Error: {ex}")
