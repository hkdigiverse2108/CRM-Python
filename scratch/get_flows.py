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

try:
    engine = create_engine(db_url)
    with engine.connect() as conn:
        print("\n=== Chatbot Flows ===")
        flows = conn.execute(text("SELECT id, name, description, is_active FROM chatbot_flows")).fetchall()
        for flow in flows:
            print(f"ID: {flow[0]}, Name: {flow[1]}, Desc: {flow[2]}, Active: {flow[3]}")
            nodes = conn.execute(text("SELECT id, type, data FROM chatbot_flow_nodes WHERE flow_id = :flow_id"), {"flow_id": flow[0]}).fetchall()
            print("  --- Nodes ---")
            for node in nodes:
                print(f"  Node ID: {node[0]}, Type: {node[1]}, Data: {node[2]}")
            edges = conn.execute(text("SELECT id, source_node_id, target_node_id, label FROM chatbot_flow_edges WHERE flow_id = :flow_id"), {"flow_id": flow[0]}).fetchall()
            print("  --- Edges ---")
            for edge in edges:
                print(f"  Edge ID: {edge[0]}, Source: {edge[1]}, Target: {edge[2]}, Label: {edge[3]}")
except Exception as e:
    print(f"Error: {e}")
