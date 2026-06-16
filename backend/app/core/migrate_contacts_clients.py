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

    # Disable foreign key checks
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")

    # 1. Create contacts table
    print("[*] Creating contacts table...")
    cursor.execute("DROP TABLE IF EXISTS contacts;")
    cursor.execute("""
    CREATE TABLE contacts (
        contact_id VARCHAR(36) NOT NULL,
        workspace_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NULL,
        phone VARCHAR(50) NULL,
        alt_phone VARCHAR(50) NULL,
        whatsapp VARCHAR(50) NULL,
        company VARCHAR(255) NULL,
        role VARCHAR(100) NULL,
        department VARCHAR(100) NULL,
        website VARCHAR(255) NULL,
        address1 VARCHAR(255) NULL,
        address2 VARCHAR(255) NULL,
        city VARCHAR(100) NULL,
        state VARCHAR(100) NULL,
        country VARCHAR(100) DEFAULT 'India',
        postal_code VARCHAR(20) NULL,
        birthday DATE NULL,
        anniversary DATE NULL,
        notes TEXT NULL,
        tags JSON NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (contact_id),
        KEY idx_contact_workspace (workspace_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)

    # 2. Create clients table
    print("[*] Creating clients table...")
    cursor.execute("DROP TABLE IF EXISTS clients;")
    cursor.execute("""
    CREATE TABLE clients (
        client_id VARCHAR(36) NOT NULL,
        workspace_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        industry VARCHAR(100) NULL,
        business_type VARCHAR(100) NULL,
        gst_number VARCHAR(50) NULL,
        pan_number VARCHAR(50) NULL,
        website VARCHAR(255) NULL,
        email VARCHAR(255) NULL,
        phone VARCHAR(50) NULL,
        alt_phone VARCHAR(50) NULL,
        address TEXT NULL,
        city VARCHAR(100) NULL,
        state VARCHAR(100) NULL,
        country VARCHAR(100) DEFAULT 'India',
        postal_code VARCHAR(20) NULL,
        annual_revenue DECIMAL(15,2) DEFAULT 0.00,
        employees_count INT DEFAULT 0,
        company_size VARCHAR(50) DEFAULT '1-10',
        owner_name VARCHAR(255) NULL,
        account_manager VARCHAR(255) NULL,
        notes TEXT NULL,
        status VARCHAR(50) DEFAULT 'Active',
        projects JSON NULL,
        activities JSON NULL,
        files JSON NULL,
        tasks JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (client_id),
        KEY idx_client_workspace (workspace_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)

    # Re-enable foreign key checks
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
    print("[+] Contacts and Clients tables created successfully!")
    conn.close()

if __name__ == "__main__":
    migrate()
