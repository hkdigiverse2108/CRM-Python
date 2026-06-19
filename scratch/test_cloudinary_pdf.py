import os
import cloudinary
import cloudinary.uploader
from sqlalchemy import text
from backend.app.core.database import get_db

with get_db() as db:
    workspace = db.execute(
        text("""
            SELECT cloudinary_cloud_name, cloudinary_api_key, cloudinary_api_secret 
            FROM workspaces 
            WHERE workspace_id = '96722' 
            LIMIT 1
        """)
    ).mappings().first()

cloudinary.config(
    cloud_name=workspace["cloudinary_cloud_name"],
    api_key=workspace["cloudinary_api_key"],
    api_secret=workspace["cloudinary_api_secret"],
    secure=True
)

pdf_bytes = b"Hello world raw bytes, not a pdf but we call it test.pdf"

print("Uploading with resource_type='raw' and no custom public_id...")
res_raw_auto = cloudinary.uploader.upload(
    pdf_bytes,
    resource_type="raw",
    folder="test_folder"
)
print("Raw auto response:")
for k, v in res_raw_auto.items():
    print(f"  {k}: {v}")

print("\nUploading with resource_type='raw' and public_id with extension...")
res_raw_ext = cloudinary.uploader.upload(
    pdf_bytes,
    resource_type="raw",
    folder="test_folder",
    public_id="test_doc_file.pdf"
)
print("Raw ext response:")
for k, v in res_raw_ext.items():
    print(f"  {k}: {v}")
