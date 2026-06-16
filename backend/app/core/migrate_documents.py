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
    print(f"[*] Connecting to database on {DB_HOST}:{DB_PORT}...")
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

    # 1. Create hrms_letter_requests table
    print("[*] Creating hrms_letter_requests table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS hrms_letter_requests (
        request_id VARCHAR(36) NOT NULL PRIMARY KEY,
        workspace_id VARCHAR(36) NOT NULL,
        employee_id VARCHAR(36) NOT NULL,
        employee_name VARCHAR(255) NOT NULL,
        letter_type VARCHAR(100) NOT NULL,
        reason TEXT NOT NULL,
        requested_date DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        actions_taken VARCHAR(100) DEFAULT 'Awaiting Admin Action',
        created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
        updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        deleted_at TIMESTAMP(6) NULL,
        KEY idx_letter_workspace (workspace_id) USING BTREE,
        KEY idx_letter_employee (employee_id) USING BTREE,
        CONSTRAINT fk_letter_workspace FOREIGN KEY (workspace_id) 
            REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_letter_employee FOREIGN KEY (employee_id) 
            REFERENCES hrms_employees (employee_id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)

    # 2. Seed hrms_documents page permission to workspace_permissions
    print("[*] Seeding hrms_documents page permissions...")
    cursor.execute("SELECT workspace_id FROM workspaces;")
    workspaces = [row[0] for row in cursor.fetchall()]

    for ws_id in workspaces:
        # Add page link permission
        cursor.execute("""
            INSERT IGNORE INTO workspace_permissions 
            (workspace_id, module, feature, link, can_add, can_edit, can_delete, can_view, can_full)
            VALUES (%s, 'hrms', 'Documents Locker', '/hrms/documents', 1, 1, 1, 1, 1);
        """, (ws_id,))

    cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
    cursor.close()
    conn.close()
    print("[+] Employee Documents system database migration completed successfully!")

if __name__ == "__main__":
    migrate()
