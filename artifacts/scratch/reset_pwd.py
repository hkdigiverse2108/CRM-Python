import sys
import os
sys.path.append(os.path.abspath("."))

from backend.app.core.database import get_db
from sqlalchemy import text
from backend.app.core.security import hash_password

hashed = hash_password("shreeji1234")
with get_db() as db:
    db.execute(text("UPDATE users SET password_hash = :hash WHERE email IN ('shreeji@gmail.com', 'vasim@gmail.com', 'kevin@gmail.com')"), {"hash": hashed})
    db.commit()
print("Passwords updated successfully for shreeji@gmail.com, vasim@gmail.com, and kevin@gmail.com to shreeji1234")
