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

    # 1. Add reply_to_message_id column to chat_messages
    try:
        cursor.execute("ALTER TABLE chat_messages ADD COLUMN reply_to_message_id VARCHAR(36) NULL;")
        print("[+] Executed: ALTER TABLE chat_messages ADD COLUMN reply_to_message_id...")
        # Add foreign key constraint
        cursor.execute("""
            ALTER TABLE chat_messages ADD CONSTRAINT fk_chat_msg_reply_to FOREIGN KEY (reply_to_message_id) 
                REFERENCES chat_messages (message_id) ON DELETE SET NULL ON UPDATE CASCADE;
        """)
        print("[+] Added foreign key constraint for reply_to_message_id.")
    except Exception as e:
        if "Duplicate column name" in str(e):
            print("[~] reply_to_message_id column already exists, skipping.")
        else:
            print(f"[!] Error: {e}")

    # 2. Create chat_channel_mutes table
    create_statements = [
        """
        CREATE TABLE IF NOT EXISTS chat_channel_mutes (
            id VARCHAR(36) NOT NULL,
            workspace_id VARCHAR(36) NOT NULL,
            channel_id VARCHAR(36) NOT NULL,
            user_id VARCHAR(36) NOT NULL,
            muted_until TIMESTAMP(6) NULL,
            PRIMARY KEY (id),
            UNIQUE KEY uq_channel_user_mute (channel_id, user_id),
            KEY idx_chat_mute_workspace (workspace_id),
            CONSTRAINT fk_chat_mute_channel FOREIGN KEY (channel_id) 
                REFERENCES chat_channels (channel_id) ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT fk_chat_mute_user FOREIGN KEY (user_id) 
                REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """
    ]

    cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
    for stmt in create_statements:
        cursor.execute(stmt)
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
    print("[+] Chat channel mutes table created/verified.")

    conn.close()

if __name__ == "__main__":
    migrate()
