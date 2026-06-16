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
    
    statements = [
        """
        CREATE TABLE IF NOT EXISTS hrms_employees (
            employee_id VARCHAR(36) NOT NULL,
            workspace_id VARCHAR(36) NOT NULL,
            name VARCHAR(255) NOT NULL,
            role VARCHAR(100) NOT NULL,
            department VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(50) NULL,
            status VARCHAR(50) DEFAULT 'Active',
            gender VARCHAR(20) DEFAULT 'Male',
            dob DATE NULL,
            blood_group VARCHAR(20) DEFAULT 'O+',
            marital_status VARCHAR(50) DEFAULT 'Single',
            emergency_contact VARCHAR(50) NULL,
            current_address TEXT NULL,
            permanent_address TEXT NULL,
            aadhaar_number VARCHAR(50) NULL,
            pan_number VARCHAR(50) NULL,
            bank_name VARCHAR(100) DEFAULT 'HDFC Bank',
            account_number VARCHAR(100) NULL,
            ifsc_code VARCHAR(50) NULL,
            uan_number VARCHAR(50) NULL,
            pf_number VARCHAR(50) NULL,
            reporting_manager VARCHAR(100) NULL,
            employment_type VARCHAR(50) DEFAULT 'Full-Time',
            join_date DATE NULL,
            shift_assignment VARCHAR(100) DEFAULT 'General Shift',
            work_location VARCHAR(100) DEFAULT 'Bangalore Office',
            attendance_status VARCHAR(50) DEFAULT 'Present',
            salary_structure JSON NULL,
            assets JSON NULL,
            documents JSON NULL,
            history JSON NULL,
            created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
            updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
            deleted_at TIMESTAMP(6) NULL,
            PRIMARY KEY (employee_id),
            KEY idx_hrms_emp_workspace (workspace_id) USING BTREE,
            CONSTRAINT fk_hrms_emp_workspace FOREIGN KEY (workspace_id) 
                REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """,
        """
        CREATE TABLE IF NOT EXISTS hrms_attendance (
            attendance_id VARCHAR(36) NOT NULL,
            workspace_id VARCHAR(36) NOT NULL,
            employee_id VARCHAR(36) NOT NULL,
            name VARCHAR(255) NOT NULL,
            role VARCHAR(100) NOT NULL,
            date DATE NOT NULL,
            check_in VARCHAR(50) NULL,
            check_out VARCHAR(50) NULL,
            working_hours DECIMAL(5,2) DEFAULT 0.00,
            break_duration VARCHAR(50) NULL,
            overtime_hours DECIMAL(5,2) DEFAULT 0.00,
            method VARCHAR(100) DEFAULT 'Manual Entry',
            status VARCHAR(50) DEFAULT 'Present',
            active TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
            updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
            deleted_at TIMESTAMP(6) NULL,
            PRIMARY KEY (attendance_id),
            KEY idx_hrms_att_workspace (workspace_id) USING BTREE,
            KEY idx_hrms_att_employee (employee_id) USING BTREE,
            CONSTRAINT fk_hrms_att_workspace FOREIGN KEY (workspace_id) 
                REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT fk_hrms_att_employee FOREIGN KEY (employee_id) 
                REFERENCES hrms_employees (employee_id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """,
        """
        CREATE TABLE IF NOT EXISTS hrms_leaves (
            leave_id VARCHAR(36) NOT NULL,
            workspace_id VARCHAR(36) NOT NULL,
            employee_id VARCHAR(36) NOT NULL,
            employee_name VARCHAR(255) NOT NULL,
            department VARCHAR(100) NOT NULL,
            type VARCHAR(100) NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            days INT NOT NULL,
            reason TEXT NULL,
            status VARCHAR(50) DEFAULT 'Pending',
            created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
            updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
            deleted_at TIMESTAMP(6) NULL,
            PRIMARY KEY (leave_id),
            KEY idx_hrms_lvs_workspace (workspace_id) USING BTREE,
            KEY idx_hrms_lvs_employee (employee_id) USING BTREE,
            CONSTRAINT fk_hrms_lvs_workspace FOREIGN KEY (workspace_id) 
                REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT fk_hrms_lvs_employee FOREIGN KEY (employee_id) 
                REFERENCES hrms_employees (employee_id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """,
        """
        CREATE TABLE IF NOT EXISTS hrms_payroll (
            payroll_id VARCHAR(36) NOT NULL,
            workspace_id VARCHAR(36) NOT NULL,
            employee_id VARCHAR(36) NOT NULL,
            employee_name VARCHAR(255) NOT NULL,
            department VARCHAR(100) NOT NULL,
            designation VARCHAR(100) NOT NULL,
            month VARCHAR(50) NOT NULL,
            basic DECIMAL(15,2) DEFAULT 0.00,
            hra DECIMAL(15,2) DEFAULT 0.00,
            allowances DECIMAL(15,2) DEFAULT 0.00,
            incentives DECIMAL(15,2) DEFAULT 0.00,
            bonus DECIMAL(15,2) DEFAULT 0.00,
            pf DECIMAL(15,2) DEFAULT 0.00,
            esi DECIMAL(15,2) DEFAULT 0.00,
            tds DECIMAL(15,2) DEFAULT 0.00,
            loan_deductions DECIMAL(15,2) DEFAULT 0.00,
            gross_pay DECIMAL(15,2) DEFAULT 0.00,
            total_deductions DECIMAL(15,2) DEFAULT 0.00,
            net_pay DECIMAL(15,2) DEFAULT 0.00,
            status VARCHAR(50) DEFAULT 'Pending',
            created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
            updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
            deleted_at TIMESTAMP(6) NULL,
            PRIMARY KEY (payroll_id),
            KEY idx_hrms_prl_workspace (workspace_id) USING BTREE,
            KEY idx_hrms_prl_employee (employee_id) USING BTREE,
            CONSTRAINT fk_hrms_prl_workspace FOREIGN KEY (workspace_id) 
                REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT fk_hrms_prl_employee FOREIGN KEY (employee_id) 
                REFERENCES hrms_employees (employee_id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """
    ]
    
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
    for stmt in statements:
        cursor.execute(stmt)
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
    
    print("[+] HRMS tables migration run successfully!")
    conn.close()

if __name__ == "__main__":
    migrate()
