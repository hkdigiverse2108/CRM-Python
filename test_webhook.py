import requests
import json
import sys
import uuid

# Change this to "live" to test on the live server, or keep "local" for local testing
TARGET = "local" 

# Base URLs
LOCAL_URL = "http://localhost:8001/api/webhooks/whatsapp"
LIVE_URL = "https://api-crm.hkdigiverse.com/api/webhooks/whatsapp"

url = LIVE_URL

# Simulated incoming WhatsApp webhook payload
# Note: phone_number_id is set to your registered ID: 1160367790492107
payload = {
    "object": "whatsapp_business_account",
    "entry": [
        {
            "id": "1577922547183844",
            "changes": [
                {
                    "field": "messages",
                    "value": {
                        "messaging_product": "whatsapp",
                        "metadata": {
                            "display_phone_number": "+91 92658 52942",
                            "phone_number_id": "1160367790492107"
                        },
                        "contacts": [
                            {
                                "profile": {
                                    "name": "Gajera Dev Test"
                                },
                                "wa_id": "916355809873"
                            }
                        ],
                        "messages": [
                            {
                                "from": "916355809873",
                                "id": f"wamid.TEST_{uuid.uuid4().hex}",
                                "timestamp": "1673000000",
                                "text": {
                                    "body": "hello"
                                },
                                "type": "text"
                            }
                        ]
                    }
                }
            ]
        }
    ]
}

headers = {
    "Content-Type": "application/json"
}

print(f"Sending mock WhatsApp message to {url}...")
try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Connection failed: {e}")
