import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv(dotenv_path="c:/CRM/.env")

db_host = os.getenv("DB_HOST")
db_port = os.getenv("DB_PORT", "3306")
db_user = os.getenv("DB_USER")
db_pass = os.getenv("DB_PASS")
db_name = os.getenv("DB_NAME")

db_url = f"mysql+pymysql://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"

try:
    engine = create_engine(db_url)
    with engine.connect() as conn:
        print("\n=== Workspaces Schema ===")
        cols = conn.execute(text("SHOW COLUMNS FROM workspaces")).fetchall()
        for col in cols:
            print(col[0], col[1])
except Exception as e:
    print(f"Error: {e}")
