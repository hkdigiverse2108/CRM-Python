from sqlalchemy import text
from backend.app.core.database import get_db

with get_db() as db:
    rows = db.execute(text("SELECT id, message_body, attachment_url, message_type FROM lead_messages WHERE attachment_url IS NOT NULL ORDER BY created_at DESC LIMIT 10")).mappings().all()
    for row in rows:
        print(f"ID: {row['id']}")
        print(f"Type: {row['message_type']}")
        print(f"Body: {row['message_body']}")
        print(f"URL: {row['attachment_url']}")
        print("-" * 50)
