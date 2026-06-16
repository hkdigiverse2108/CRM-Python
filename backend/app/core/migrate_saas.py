import os
import pymysql
from pathlib import Path
from dotenv import load_dotenv

# Resolve root .env path relative to this script
ENV_PATH = Path(__file__).resolve().parent.parent.parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "")
DB_NAME = os.getenv("DB_NAME", "enterprise_crm")

def migrate():
    print(f"[*] Connecting to MySQL server at {DB_HOST}:{DB_PORT}...")
    conn = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASS,
        database=DB_NAME,
        autocommit=True
    )
    cursor = conn.cursor()

    # Disable foreign key checks for schema changes
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")

    # 1. Update workspaces table
    print("[*] Checking workspaces table columns...")
    cursor.execute("DESCRIBE workspaces;")
    ws_columns = [col[0] for col in cursor.fetchall()]
    
    new_ws_fields = {
        "state": "VARCHAR(100) NULL",
        "city": "VARCHAR(100) NULL",
        "trial_days": "INT DEFAULT 0",
        "trial_ends_at": "TIMESTAMP NULL",
        "max_branches": "INT DEFAULT 1",
        "max_leads": "INT DEFAULT 1000",
        "max_pipelines": "INT DEFAULT 5",
        "max_projects": "INT DEFAULT 10",
        "max_automations": "INT DEFAULT 10",
        "max_campaigns": "INT DEFAULT 10",
        "smtp_host": "VARCHAR(255) NULL",
        "smtp_port": "INT NULL",
        "smtp_user": "VARCHAR(255) NULL",
        "smtp_pass": "VARCHAR(255) NULL",
        "branding_enabled": "TINYINT(1) DEFAULT 0",
        "mobile_branding_enabled": "TINYINT(1) DEFAULT 0",
        "is_locked": "TINYINT(1) DEFAULT 0"
    }

    for field, field_type in new_ws_fields.items():
        if field not in ws_columns:
            print(f"[+] Adding {field} column to workspaces table...")
            cursor.execute(f"ALTER TABLE workspaces ADD COLUMN {field} {field_type};")

    # 2. Update users table
    print("[*] Checking users table columns...")
    cursor.execute("DESCRIBE users;")
    user_columns = [col[0] for col in cursor.fetchall()]
    
    new_user_fields = {
        "two_factor_enabled": "TINYINT(1) DEFAULT 0",
        "is_locked": "TINYINT(1) DEFAULT 0"
    }

    for field, field_type in new_user_fields.items():
        if field not in user_columns:
            print(f"[+] Adding {field} column to users table...")
            cursor.execute(f"ALTER TABLE users ADD COLUMN {field} {field_type};")

    # 3. Create departments table
    print("[*] Creating departments table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS departments (
        department_id VARCHAR(36) NOT NULL,
        workspace_id VARCHAR(36) NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (department_id),
        KEY idx_dept_workspace (workspace_id) USING BTREE,
        CONSTRAINT fk_dept_workspace FOREIGN KEY (workspace_id) 
            REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)

    # 4. Create branches table
    print("[*] Creating branches table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS branches (
        branch_id VARCHAR(36) NOT NULL,
        workspace_id VARCHAR(36) NOT NULL,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) NULL,
        city VARCHAR(100) NULL,
        state VARCHAR(100) NULL,
        country VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (branch_id),
        KEY idx_branch_workspace (workspace_id) USING BTREE,
        CONSTRAINT fk_branch_workspace FOREIGN KEY (workspace_id) 
            REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)

    # 5. Create saas_audit_logs table
    print("[*] Creating saas_audit_logs table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS saas_audit_logs (
        log_id VARCHAR(36) NOT NULL,
        workspace_id VARCHAR(36) NULL,
        user_id VARCHAR(36) NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        action VARCHAR(100) NOT NULL,
        details TEXT NULL,
        ip_address VARCHAR(50) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (log_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)

    # Re-enable foreign key checks
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
    print("[+] SaaS migration completed successfully!")
    conn.close()

if __name__ == "__main__":
    migrate()
