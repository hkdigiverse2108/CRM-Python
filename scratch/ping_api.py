import httpx

url = "https://api-crm.hkdigiverse.com/api/integrations/whatsapp/upload"
headers = {"X-Tenant-ID": "96722"}
print("Pinging:", url)
try:
    resp = httpx.get(url, headers=headers)
    print("GET Status Code:", resp.status_code)
    print("GET Response:", resp.text)
except Exception as e:
    print("Error:", e)
