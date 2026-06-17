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
    
    # Check if columns already exist, if not, add them
    columns_to_add = {
        "login_greeting": "VARCHAR(255) DEFAULT 'Enterprise multi-tenant customer relationship hub'",
        "shift_start": "VARCHAR(50) DEFAULT '09:00'",
        "shift_end": "VARCHAR(50) DEFAULT '18:00'",
        "company_pan": "VARCHAR(100) DEFAULT NULL"
    }
    
    cursor.execute("DESCRIBE workspaces")
    existing_cols = [row[0] for row in cursor.fetchall()]
    
    for col_name, col_type in columns_to_add.items():
        if col_name not in existing_cols:
            print(f"[*] Adding column {col_name} to workspaces table...")
            cursor.execute(f"ALTER TABLE workspaces ADD COLUMN {col_name} {col_type}")
            print(f"[+] Column {col_name} added successfully.")
        else:
            print(f"[-] Column {col_name} already exists in workspaces table.")
            
    conn.close()
    print("[+] Database migration complete.")

if __name__ == "__main__":
    migrate()
