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
        print("Adding Cloudinary columns to workspaces...")
        
        # We check if columns exist first, otherwise add
        cols = [c[0] for c in conn.execute(text("SHOW COLUMNS FROM workspaces")).fetchall()]
        
        if "cloudinary_cloud_name" not in cols:
            conn.execute(text("ALTER TABLE workspaces ADD COLUMN cloudinary_cloud_name VARCHAR(255) DEFAULT NULL"))
            print("Added cloudinary_cloud_name")
            
        if "cloudinary_api_key" not in cols:
            conn.execute(text("ALTER TABLE workspaces ADD COLUMN cloudinary_api_key VARCHAR(255) DEFAULT NULL"))
            print("Added cloudinary_api_key")
            
        if "cloudinary_api_secret" not in cols:
            conn.execute(text("ALTER TABLE workspaces ADD COLUMN cloudinary_api_secret VARCHAR(255) DEFAULT NULL"))
            print("Added cloudinary_api_secret")
            
        print("Success!")
except Exception as e:
    print(f"Error: {e}")
