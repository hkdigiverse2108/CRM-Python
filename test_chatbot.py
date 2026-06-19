import asyncio
import os
import sys
from sqlalchemy import text
from dotenv import load_dotenv

# Add workspace to path
sys.path.append("c:/CRM")

load_dotenv("c:/CRM/.env")

from backend.app.core.database import get_db
from backend.app.services.chatbot_service import run_chatbot_flow_engine

async def main():
    tenant_id = "96722"
    phone = "918780564463"
    message = "Yes"
    
    print(f"Simulating chatbot engine run for phone {phone} with msg '{message}'...")
    
    with get_db() as db:
        try:
            await run_chatbot_flow_engine(tenant_id, phone, message, db)
            print("Chatbot engine execution completed successfully.")
        except Exception as e:
            print("Error running chatbot engine:")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
