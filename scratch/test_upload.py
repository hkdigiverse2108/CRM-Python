import os
import httpx
from jose import jwt
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

load_dotenv(dotenv_path="c:/CRM/.env")

# Generate Token
secret_key = os.getenv("JWT_SECRET_KEY")
algorithm = os.getenv("JWT_ALGORITHM", "HS256")

payload = {
    "sub": "022fcf6d-dc0e-449c-a5c8-2469258282a6",
    "email": "darshit@gmail.com",
    "role": "022fcf6d-dc0e-449c-a5c8-2469258282a6",
    "tenant_id": "71110",
    "exp": datetime.now(timezone.utc) + timedelta(minutes=30),
    "iat": datetime.now(timezone.utc),
    "type": "access"
}

token = jwt.encode(payload, secret_key, algorithm=algorithm)
print("Generated Token:", token)

# Try uploading a dummy file
url = "https://api-crm.hkdigiverse.com/api/integrations/whatsapp/upload"
headers = {
    "Authorization": f"Bearer {token}",
    "X-Tenant-ID": "71110"
}
files = {
    "file": ("test.png", b"fake image bytes here", "image/png")
}

print("Uploading to:", url)
try:
    resp = httpx.post(url, headers=headers, files=files)
    print("Response Status Code:", resp.status_code)
    print("Response Text:", resp.text)
except Exception as e:
    print("Request failed:", e)
