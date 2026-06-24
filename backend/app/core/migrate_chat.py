import os
import pymysql
import uuid
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
        CREATE TABLE IF NOT EXISTS chat_channels (
            channel_id VARCHAR(36) NOT NULL,
            workspace_id VARCHAR(36) NOT NULL,
            name VARCHAR(255) NULL,
            type VARCHAR(50) NOT NULL DEFAULT 'direct', -- 'direct', 'group', 'general'
            created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
            PRIMARY KEY (channel_id),
            KEY idx_chat_channel_workspace (workspace_id),
            CONSTRAINT fk_chat_channel_workspace FOREIGN KEY (workspace_id) 
                REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """,
        """
        CREATE TABLE IF NOT EXISTS chat_channel_members (
            id VARCHAR(36) NOT NULL,
            workspace_id VARCHAR(36) NOT NULL,
            channel_id VARCHAR(36) NOT NULL,
            user_id VARCHAR(36) NOT NULL,
            joined_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
            PRIMARY KEY (id),
            UNIQUE KEY uq_channel_user (channel_id, user_id),
            KEY idx_chat_member_workspace (workspace_id),
            CONSTRAINT fk_chat_member_channel FOREIGN KEY (channel_id) 
                REFERENCES chat_channels (channel_id) ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT fk_chat_member_user FOREIGN KEY (user_id) 
                REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """,
        """
        CREATE TABLE IF NOT EXISTS chat_messages (
            message_id VARCHAR(36) NOT NULL,
            workspace_id VARCHAR(36) NOT NULL,
            channel_id VARCHAR(36) NOT NULL,
            sender_id VARCHAR(36) NOT NULL,
            message_text TEXT NOT NULL,
            created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
            PRIMARY KEY (message_id),
            KEY idx_chat_msg_channel (channel_id),
            KEY idx_chat_msg_workspace (workspace_id),
            CONSTRAINT fk_chat_msg_channel FOREIGN KEY (channel_id) 
                REFERENCES chat_channels (channel_id) ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT fk_chat_msg_sender FOREIGN KEY (sender_id) 
                REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """
    ]

    cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
    for stmt in statements:
        cursor.execute(stmt)
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
    print("[+] Chat database tables created successfully.")

    # Seeding general channel for existing workspaces if missing
    cursor.execute("SELECT workspace_id FROM workspaces;")
    workspaces = cursor.fetchall()
    for (ws_id,) in workspaces:
        # Check if general channel already exists
        cursor.execute(
            "SELECT channel_id FROM chat_channels WHERE workspace_id = %s AND type = 'general' LIMIT 1;",
            (ws_id,)
        )
        exists = cursor.fetchone()
        if not exists:
            gen_id = f"gen_channel_{ws_id}"
            cursor.execute(
                "INSERT INTO chat_channels (channel_id, workspace_id, name, type) VALUES (%s, %s, %s, 'general');",
                (gen_id, ws_id, "General Announcements")
            )
            print(f"[+] Seeded General Announcements channel for workspace {ws_id}")

    conn.close()

if __name__ == "__main__":
    migrate()
