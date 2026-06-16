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

    print("[*] Creating table 'whatsapp_accounts' if not exists...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS whatsapp_accounts (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        tenant_id VARCHAR(36) NOT NULL,
        business_name VARCHAR(255) NULL,
        waba_id VARCHAR(255) NULL,
        phone_number_id VARCHAR(255) NULL,
        access_token TEXT NULL,
        display_phone_number VARCHAR(50) NULL,
        status VARCHAR(50) DEFAULT 'Connected',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_wa_acc_tenant (tenant_id) USING BTREE,
        CONSTRAINT fk_wa_acc_tenant FOREIGN KEY (tenant_id) 
            REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)
    print("[+] Table 'whatsapp_accounts' created successfully!")
    conn.close()

if __name__ == "__main__":
    migrate()
