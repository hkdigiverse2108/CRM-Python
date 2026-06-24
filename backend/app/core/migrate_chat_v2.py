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

    # 1. Alter chat_messages to support files and pinning
    alter_statements = [
        "ALTER TABLE chat_messages ADD COLUMN file_url TEXT NULL;",
        "ALTER TABLE chat_messages ADD COLUMN file_name VARCHAR(255) NULL;",
        "ALTER TABLE chat_messages ADD COLUMN file_type VARCHAR(100) NULL;",
        "ALTER TABLE chat_messages ADD COLUMN is_pinned TINYINT(1) NOT NULL DEFAULT 0;"
    ]

    for stmt in alter_statements:
        try:
            cursor.execute(stmt)
            print(f"[+] Executed: {stmt[:40]}...")
        except Exception as e:
            if "Duplicate column name" in str(e):
                print(f"[~] Column already exists, skipping.")
            else:
                print(f"[!] Error: {e}")

    # 2. Create chat_message_reads and chat_message_reactions tables
    create_statements = [
        """
        CREATE TABLE IF NOT EXISTS chat_message_reads (
            id VARCHAR(36) NOT NULL,
            workspace_id VARCHAR(36) NOT NULL,
            message_id VARCHAR(36) NOT NULL,
            user_id VARCHAR(36) NOT NULL,
            read_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
            PRIMARY KEY (id),
            UNIQUE KEY uq_msg_user_read (message_id, user_id),
            KEY idx_chat_read_workspace (workspace_id),
            CONSTRAINT fk_chat_read_msg FOREIGN KEY (message_id) 
                REFERENCES chat_messages (message_id) ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT fk_chat_read_user FOREIGN KEY (user_id) 
                REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """,
        """
        CREATE TABLE IF NOT EXISTS chat_message_reactions (
            id VARCHAR(36) NOT NULL,
            workspace_id VARCHAR(36) NOT NULL,
            message_id VARCHAR(36) NOT NULL,
            user_id VARCHAR(36) NOT NULL,
            emoji VARCHAR(50) NOT NULL,
            created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
            PRIMARY KEY (id),
            UNIQUE KEY uq_msg_user_emoji (message_id, user_id, emoji),
            KEY idx_chat_reaction_workspace (workspace_id),
            CONSTRAINT fk_chat_reaction_msg FOREIGN KEY (message_id) 
                REFERENCES chat_messages (message_id) ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT fk_chat_reaction_user FOREIGN KEY (user_id) 
                REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """
    ]

    cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
    for stmt in create_statements:
        cursor.execute(stmt)
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
    print("[+] Chat message reads and reactions tables created/verified.")

    conn.close()

if __name__ == "__main__":
    migrate()
