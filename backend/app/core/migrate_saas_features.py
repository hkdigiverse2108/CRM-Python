import os
import pymysql
from pathlib import Path
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent.parent.parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "")
DB_NAME = os.getenv("DB_NAME", "enterprise_crm")

def migrate():
    print(f"[*] Connecting to {DB_HOST}:{DB_PORT}...")
    conn = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASS,
        database=DB_NAME,
        autocommit=True
    )
    cursor = conn.cursor()

    cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")

    # 1. Create workspace_modules table
    print("[*] Creating workspace_modules table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS workspace_modules (
        workspace_id VARCHAR(36) NOT NULL,
        module VARCHAR(50) NOT NULL,
        is_enabled TINYINT(1) DEFAULT 1,
        updated_by VARCHAR(36) NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (workspace_id, module),
        CONSTRAINT fk_ws_mod_workspace FOREIGN KEY (workspace_id) 
            REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)

    # 2. Create workspace_roles table
    print("[*] Creating workspace_roles table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS workspace_roles (
        workspace_id VARCHAR(36) NOT NULL,
        role_suffix VARCHAR(50) NOT NULL,
        is_enabled TINYINT(1) DEFAULT 1,
        PRIMARY KEY (workspace_id, role_suffix),
        CONSTRAINT fk_ws_role_workspace FOREIGN KEY (workspace_id) 
            REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)

    # 3. Seed active modules for existing workspaces
    print("[*] Seeding default modules for existing workspaces...")
    cursor.execute("SELECT workspace_id FROM workspaces;")
    workspaces = [row[0] for row in cursor.fetchall()]

    modules = [
        "dashboard", "crm", "sales", "whatsapp", "marketing", "automation",
        "finance", "hrms", "support", "projects", "reports", "settings",
        "users", "audit_logs", "integrations"
    ]

    roles_suffixes = [
        "super_admin", "admin_001", "mgr_001", "agent_001", "marketing_mgr",
        "marketing_exec", "hr_mgr", "hr_exec", "accountant_001", "support_mgr",
        "support_001", "project_mgr", "team_member", "operations_mgr",
        "inventory_mgr", "call_center_agent", "whatsapp_agent", "receptionist"
    ]

    for ws_id in workspaces:
        for mod in modules:
            cursor.execute("""
                INSERT IGNORE INTO workspace_modules (workspace_id, module, is_enabled)
                VALUES (%s, %s, 1);
            """, (ws_id, mod))
        
        for role_suf in roles_suffixes:
            cursor.execute("""
                INSERT IGNORE INTO workspace_roles (workspace_id, role_suffix, is_enabled)
                VALUES (%s, %s, 1);
            """, (ws_id, role_suf))

    cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
    cursor.close()
    conn.close()
    print("[OK] Migration completed successfully.")

if __name__ == "__main__":
    migrate()
