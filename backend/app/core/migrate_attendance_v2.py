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

    # Check and add columns to hrms_attendance
    print("[*] Checking hrms_attendance table columns...")
    cursor.execute("DESCRIBE hrms_attendance;")
    columns = [col[0] for col in cursor.fetchall()]

    if "current_status" not in columns:
        print("[+] Adding current_status column to hrms_attendance...")
        cursor.execute("ALTER TABLE hrms_attendance ADD COLUMN current_status VARCHAR(50) DEFAULT 'punch-out';")
    else:
        print("[*] Column current_status already exists.")

    if "break_history" not in columns:
        print("[+] Adding break_history column to hrms_attendance...")
        cursor.execute("ALTER TABLE hrms_attendance ADD COLUMN break_history TEXT NULL;")
    else:
        print("[*] Column break_history already exists.")

    # Re-enable foreign key checks
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
    print("[+] Attendance columns migration run successfully!")
    conn.close()

if __name__ == "__main__":
    migrate()
