"""
Database Initialization and Seeding Script
==========================================
Connects to XAMPP MySQL, creates the database if missing, executes schema.sql,
and seeds multi-tenant data for workspaces, roles, permissions, users,
lead sources, lead statuses, and demo leads.
"""

import os
import sys
import uuid
import pymysql
from pathlib import Path
from dotenv import load_dotenv

# Resolve root .env path relative to this script
ENV_PATH = Path(__file__).resolve().parent.parent.parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

# Add project root to path to allow imports if needed
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
sys.path.append(PROJECT_ROOT)

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "")
DB_NAME = os.getenv("DB_NAME", "enterprise_crm")


def run_init():
    print("=" * 60)
    print("       AIO CRM Platform — Database Initialization Service")
    print("=" * 60)

    # 1. Connect to MySQL Server (without database to ensure it exists)
    try:
        print(f"[*] Connecting to MySQL server at {DB_HOST}:{DB_PORT}...")
        conn = pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASS,
            autocommit=True
        )
        cursor = conn.cursor()
    except Exception as e:
        print(f"[!] Connection failed: {e}")
        print(f"[!] Make sure XAMPP MySQL is running on port {DB_PORT}.")
        sys.exit(1)

    # 2. Create database if not exists
    try:
        print(f"[*] Ensuring database '{DB_NAME}' exists...")
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        conn.select_db(DB_NAME)
    except Exception as e:
        print(f"[!] Failed to create database: {e}")
        conn.close()
        sys.exit(1)

    # 3. Read and execute schema.sql
    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
    if not os.path.exists(schema_path):
        print(f"[!] schema.sql not found at: {schema_path}")
        conn.close()
        sys.exit(1)

    try:
        print(f"[*] Reading database schema from: schema.sql...")
        with open(schema_path, "r", encoding="utf-8") as f:
            schema_sql = f.read()

        print("[*] Executing schema statements...")
        # Simple SQL statement splitter (ignores comments and empty statements)
        statements = []
        current_statement = []
        for line in schema_sql.splitlines():
            # Strip comments
            line_clean = line.strip()
            if line_clean.startswith("--") or not line_clean:
                continue
            current_statement.append(line)
            if line_clean.endswith(";"):
                statements.append("\n".join(current_statement))
                current_statement = []

        # Execute statements inside a transaction
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
        for stmt in statements:
            if stmt.strip():
                try:
                    cursor.execute(stmt)
                except Exception as stmt_error:
                    print(f"[!] Error executing statement:\n{stmt}\nError: {stmt_error}")
                    raise stmt_error
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
        print("[+] Schema creation completed successfully.")
    except Exception as e:
        print(f"[!] Failed to run schema.sql: {e}")
        conn.close()
        sys.exit(1)

    # 4. Seed default data inside a transaction
    try:
        print("[*] Seeding default workspace, roles, users, and leads...")
        cursor.execute("START TRANSACTION;")

        # A. Seed Workspaces
        workspaces = [
            ("rapidmodel_corp", "RapidModel Corp", "RapidModel Corp", "rapidmodel_corp", "rapidmodel.ai", "", "#6366f1", "Asia/Kolkata", "INR", "India", "en", "enterprise", "active", "billing@rapidmodel.ai", 200, 50000, 100)
        ]
        
        # Check if workspace already exists
        cursor.execute("SELECT workspace_id FROM workspaces")
        existing_workspaces = {row[0] for row in cursor.fetchall()}
        
        for ws in workspaces:
            if ws[0] not in existing_workspaces:
                cursor.execute("""
                    INSERT INTO workspaces (workspace_id, workspace_name, business_name, subdomain, custom_domain, logo_url, brand_color, timezone, currency, country, language, plan_id, plan_status, billing_email, max_users, max_contacts, max_storage_gb)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, ws)

        # B. Seed Roles
        roles = [
            ("role_super_admin", "Super Admin", "Full Platform Access and Management"),
            ("role_admin_001", "Workspace Admin", "Full system permissions"),
            ("role_mgr_001", "Sales Manager", "Manage sales teams, pipelines, campaigns and view reports"),
            ("role_agent_001", "Sales Agent", "Manage leads, contacts, tasks and client comms"),
            ("role_support_001", "Support Agent", "Manage customer tickets and messaging chats"),
            ("role_accountant_001", "Accountant", "Manage invoices, payments, expense claims and ledgers")
        ]
        
        cursor.execute("SELECT role_id FROM roles")
        existing_roles = {row[0] for row in cursor.fetchall()}
        
        for r_id, r_name, r_desc in roles:
            for ws_id in ["rapidmodel_corp"]:
                # Composite key check (in roles we use role_id as PK, so we can make unique per role/workspace)
                actual_role_id = f"{r_id}_{ws_id}"
                if actual_role_id not in existing_roles:
                    cursor.execute("""
                        INSERT INTO roles (role_id, workspace_id, role_name, description)
                        VALUES (%s, %s, %s, %s)
                    """, (actual_role_id, ws_id, r_name, r_desc))

        # E. Seed Users
        # Wipe all existing users to ensure only the new user exists
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
        cursor.execute("TRUNCATE TABLE users;")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")

        users = [
            ("usr_super_admin_001", "rapidmodel_corp", "role_super_admin_rapidmodel_corp", "Super Admin", "superadmin@rapidmodel.ai", "+91-9999999999", "$2b$12$PNx9QIYZDmbE0NEjft/TlO6R3n9W.Ll/sqJGuKZux8.Qe8Nw39s0i", "https://lh3.googleusercontent.com/aida-public/AB6AXuCEtKQPcmT818U7NmXsWLGpg--sLLoaJj2Yaz93EJ82OVS_5FOwnn0zFQ02baKg2BhT7ej6Cowz8PIcDuuuBv7C3lA0ik_xqtGYHPGn_q1bmwZw2DIXcO4V5MIfimYx1BySVkSIPuZk5AO29v6pEJuoFAjn5t2h1yZ8uDCibDtiILbrdPu98-piyswq_emYdnWrOsHsx5Ue5KO0layy4JM14MpLatfVgmZmRzj_78-7u_JBXoqwGQvpA__RhwocMYEQv58UVsHiZ6w", "active"),
            ("usr_admin_001", "rapidmodel_corp", "role_admin_001_rapidmodel_corp", "Prince Gajera", "princegajera0506@gmail.com", "+91-9876543210", "$2b$12$PNx9QIYZDmbE0NEjft/TlO6R3n9W.Ll/sqJGuKZux8.Qe8Nw39s0i", "https://lh3.googleusercontent.com/aida-public/AB6AXuCEtKQPcmT818U7NmXsWLGpg--sLLoaJj2Yaz93EJ82OVS_5FOwnn0zFQ02baKg2BhT7ej6Cowz8PIcDuuuBv7C3lA0ik_xqtGYHPGn_q1bmwZw2DIXcO4V5MIfimYx1BySVkSIPuZk5AO29v6pEJuoFAjn5t2h1yZ8uDCibDtiILbrdPu98-piyswq_emYdnWrOsHsx5Ue5KO0layy4JM14MpLatfVgmZmRzj_78-7u_JBXoqwGQvpA__RhwocMYEQv58UVsHiZ6w", "active")
        ]
        
        for u_id, ws_id, r_id, name, email, phone, pwd_hash, avatar, status in users:
            cursor.execute("""
                INSERT INTO users (user_id, workspace_id, role_id, full_name, email, phone, password_hash, avatar_url, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (u_id, ws_id, r_id, name, email, phone, pwd_hash, avatar, status))

        # F. Seed Lead Sources
        lead_sources = [
            "WhatsApp", "Meta Ads", "Shopify", "Website Form", "Manual", 
            "Referral", "JustDial", "IndiaMart", "TradeIndia", "Facebook", "Instagram"
        ]
        
        cursor.execute("SELECT source_name FROM lead_sources")
        existing_sources = {row[0] for row in cursor.fetchall()}
        
        for name in lead_sources:
            for ws_id in ["rapidmodel_corp"]:
                if name not in existing_sources:
                    ls_id = str(uuid.uuid4())
                    cursor.execute("""
                        INSERT IGNORE INTO lead_sources (id, workspace_id, source_name, description)
                        VALUES (%s, %s, %s, %s)
                    """, (ls_id, ws_id, name, f"{name} integration feed"))

        # G. Seed Lead Statuses
        lead_statuses = [
            ("New", "#3b82f6", 1, 1),
            ("Contacted", "#8b5cf6", 2, 0),
            ("Qualified", "#a855f7", 3, 0),
            ("Proposal", "#f97316", 4, 0),
            ("Negotiation", "#805ad5", 5, 0),
            ("Won", "#10b981", 6, 0),
            ("Lost", "#ef4444", 7, 0),
            ("Junk", "#64748b", 8, 0)
        ]
        
        cursor.execute("SELECT status_name FROM lead_statuses")
        existing_statuses = {row[0] for row in cursor.fetchall()}
        
        for name, color, sort_order, is_default in lead_statuses:
            for ws_id in ["rapidmodel_corp"]:
                if name not in existing_statuses:
                    lst_id = str(uuid.uuid4())
                    cursor.execute("""
                        INSERT IGNORE INTO lead_statuses (id, workspace_id, status_name, color, sort_order, is_default)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, (lst_id, ws_id, name, color, sort_order, is_default))

        # H. Seed Lead Tags
        lead_tags = [
            ("Hot Lead", "#ef4444"),
            ("Warm Lead", "#f97316"),
            ("Cold Lead", "#3b82f6"),
            ("VIP", "#805ad5"),
            ("Follow Up", "#ec4899"),
            ("Repeat Customer", "#10b981")
        ]

        # I. Seed Demo Leads & Activities (Removed for Clean Database State)
        # Note: Leads, Lead Tags, and Lead Activities tables are kept clean.

        conn.commit()
        print("[+] Seed data populated successfully.")
    except Exception as e:
        conn.rollback()
        print(f"[!] Seeding failed: {e}")
        conn.close()
        sys.exit(1)

    cursor.close()
    conn.close()
    print("[+] Database initialization complete. Ready for connections.")


if __name__ == "__main__":
    run_init()
