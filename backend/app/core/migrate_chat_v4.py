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

    # 1. Add deleted_at column to chat_messages
    try:
        cursor.execute("ALTER TABLE chat_messages ADD COLUMN deleted_at TIMESTAMP(6) NULL;")
        print("[+] Executed: ALTER TABLE chat_messages ADD COLUMN deleted_at...")
    except Exception as e:
        if "Duplicate column name" in str(e):
            print("[~] deleted_at column already exists, skipping.")
        else:
            print(f"[!] Error: {e}")

    conn.close()

if __name__ == "__main__":
    migrate()
