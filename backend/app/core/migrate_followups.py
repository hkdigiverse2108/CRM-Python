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
    
    # Check existing columns
    cursor.execute("DESCRIBE lead_followups;")
    columns = [col[0] for col in cursor.fetchall()]
    
    if "next_followup_date" not in columns:
        print("[+] Adding next_followup_date column...")
        cursor.execute("ALTER TABLE lead_followups ADD COLUMN next_followup_date DATE NULL;")
        
    if "next_followup_remarks" not in columns:
        print("[+] Adding next_followup_remarks column...")
        cursor.execute("ALTER TABLE lead_followups ADD COLUMN next_followup_remarks TEXT NULL;")
        
    print("[+] Migration completed successfully!")
    conn.close()

if __name__ == "__main__":
    migrate()
