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
    
    cursor.execute("DESCRIBE workspaces")
    existing_cols = [row[0] for row in cursor.fetchall()]
    
    if "break_start" not in existing_cols:
        print("[*] Adding column break_start to workspaces table...")
        cursor.execute("ALTER TABLE workspaces ADD COLUMN break_start VARCHAR(50) DEFAULT '01:00 PM'")
        print("[+] Column break_start added successfully.")
    
    if "break_end" not in existing_cols:
        print("[*] Adding column break_end to workspaces table...")
        cursor.execute("ALTER TABLE workspaces ADD COLUMN break_end VARCHAR(50) DEFAULT '02:00 PM'")
        print("[+] Column break_end added successfully.")
            
    conn.close()
    print("[+] Database migration complete.")

if __name__ == "__main__":
    migrate()
