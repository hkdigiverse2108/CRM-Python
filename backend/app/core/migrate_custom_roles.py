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

    # Check columns in roles table
    cursor.execute("DESCRIBE roles;")
    columns = [col[0] for col in cursor.fetchall()]

    new_cols = {
        "role_color": "VARCHAR(50) DEFAULT '#6366f1'",
        "status": "VARCHAR(50) DEFAULT 'active'",
        "created_by": "VARCHAR(36) NULL",
        "pages_permissions": "TEXT NULL",
        "buttons_permissions": "TEXT NULL",
        "department_access": "TEXT NULL",
        "branch_access": "TEXT NULL"
    }

    for col_name, col_type in new_cols.items():
        if col_name not in columns:
            print(f"[+] Adding column {col_name} ({col_type}) to roles table...")
            cursor.execute(f"ALTER TABLE roles ADD COLUMN {col_name} {col_type};")

    cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
    cursor.close()
    conn.close()
    print("[OK] Custom roles database migration completed successfully.")

if __name__ == "__main__":
    migrate()
