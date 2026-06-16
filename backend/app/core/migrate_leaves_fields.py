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

    try:
        # Check if columns already exist
        cursor.execute("DESCRIBE hrms_leaves;")
        columns = [row[0] for row in cursor.fetchall()]

        if "day_type" not in columns:
            print("[*] Adding day_type column...")
            cursor.execute("ALTER TABLE hrms_leaves ADD COLUMN day_type VARCHAR(50) DEFAULT 'Full Day';")

        if "approved_by" not in columns:
            print("[*] Adding approved_by column...")
            cursor.execute("ALTER TABLE hrms_leaves ADD COLUMN approved_by VARCHAR(255) NULL;")

        if "proof_of_leave" not in columns:
            print("[*] Adding proof_of_leave column...")
            cursor.execute("ALTER TABLE hrms_leaves ADD COLUMN proof_of_leave VARCHAR(255) NULL;")

        print("[OK] Leaves schema migration completed successfully.")
    except Exception as e:
        print(f"[!] Migration failed: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    migrate()
