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
        CREATE TABLE IF NOT EXISTS tasks (
            task_id VARCHAR(36) NOT NULL,
            workspace_id VARCHAR(36) NOT NULL,
            title VARCHAR(255) NOT NULL,
            type VARCHAR(100) DEFAULT 'Task',
            priority VARCHAR(50) DEFAULT 'Medium',
            status VARCHAR(50) DEFAULT 'To Do',
            assignee VARCHAR(255) DEFAULT 'Arjun Mehta',
            start_date DATE NULL,
            due_date DATE NULL,
            reminder_date DATE NULL,
            description TEXT NULL,
            notes TEXT NULL,
            project VARCHAR(255) DEFAULT 'General',
            created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
            updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
            deleted_at TIMESTAMP(6) NULL,
            PRIMARY KEY (task_id),
            KEY idx_task_workspace (workspace_id) USING BTREE,
            CONSTRAINT fk_task_workspace FOREIGN KEY (workspace_id) 
                REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """,
        """
        CREATE TABLE IF NOT EXISTS reminders (
            reminder_id VARCHAR(36) NOT NULL,
            workspace_id VARCHAR(36) NOT NULL,
            description TEXT NOT NULL,
            type VARCHAR(100) DEFAULT 'Call',
            time VARCHAR(100) NOT NULL,
            priority VARCHAR(50) DEFAULT 'Medium',
            linked_to VARCHAR(255) DEFAULT 'Vikram Patel',
            completed TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
            updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
            deleted_at TIMESTAMP(6) NULL,
            PRIMARY KEY (reminder_id),
            KEY idx_reminder_workspace (workspace_id) USING BTREE,
            CONSTRAINT fk_reminder_workspace FOREIGN KEY (workspace_id) 
                REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """
    ]
    
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
    for stmt in statements:
        cursor.execute(stmt)
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
    
    print("[+] Tasks & Reminders tables migration run successfully!")
    conn.close()

if __name__ == "__main__":
    migrate()
