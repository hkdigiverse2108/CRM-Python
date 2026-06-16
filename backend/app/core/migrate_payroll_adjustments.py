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
    
    # Create the table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS hrms_payroll_adjustments (
        adjustment_id VARCHAR(36) NOT NULL,
        workspace_id VARCHAR(36) NOT NULL,
        employee_id VARCHAR(36) NOT NULL,
        employee_name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(15,2) DEFAULT 0.00,
        date DATE NOT NULL,
        reason TEXT NOT NULL,
        created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
        updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (adjustment_id),
        KEY idx_hrms_pa_workspace (workspace_id) USING BTREE,
        KEY idx_hrms_pa_employee (employee_id) USING BTREE,
        CONSTRAINT fk_hrms_pa_workspace FOREIGN KEY (workspace_id) 
            REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_hrms_pa_employee FOREIGN KEY (employee_id) 
            REFERENCES hrms_employees (employee_id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)
    print("[+] Created hrms_payroll_adjustments table.")

    # Fetch Parth Devani or first employee to seed an adjustment
    cursor.execute("SELECT employee_id, name, workspace_id FROM hrms_employees LIMIT 1")
    row = cursor.fetchone()
    if row:
        emp_id, emp_name, ws_id = row
        print(f"[*] Seeding a test adjustment for {emp_name} ({emp_id})...")
        
        # Check if already seeded
        cursor.execute("SELECT COUNT(*) FROM hrms_payroll_adjustments WHERE employee_id = %s", (emp_id,))
        cnt = cursor.fetchone()[0]
        if cnt == 0:
            cursor.execute("""
            INSERT INTO hrms_payroll_adjustments (adjustment_id, workspace_id, employee_id, employee_name, type, amount, date, reason)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                "pa_seed_001",
                ws_id,
                emp_id,
                emp_name,
                "DEDUCTION",
                0.00,
                "2026-06-12",
                "[Remark] Late Punch-in: Late Punch-in detected at 14:07. Shift starts at 09:30 with a 30-minute buffer (Late by 247 minutes)"
            ))
            print("[+] Seeded late punch-in adjustment.")
    
    conn.close()
    print("[+] Payroll adjustments migration complete.")

if __name__ == "__main__":
    migrate()
