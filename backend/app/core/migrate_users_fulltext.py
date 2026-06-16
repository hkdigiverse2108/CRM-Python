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

    cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
    
    print("[*] Checking index ft_users on table users...")
    cursor.execute("SHOW INDEX FROM users WHERE Key_name = 'ft_users';")
    if not cursor.fetchall():
        print("[+] Creating FULLTEXT index ft_users on table users(full_name, email, phone)...")
        try:
            cursor.execute("ALTER TABLE users ADD FULLTEXT INDEX ft_users (full_name, email, phone);")
            print("[OK] Created index ft_users successfully.")
        except Exception as e:
            print(f"[!] Error creating index: {e}")
    else:
        print("[~] Index ft_users already exists. Skipping.")

    cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
    cursor.close()
    conn.close()
    print("[*] Migration completed successfully.")

if __name__ == "__main__":
    migrate()
