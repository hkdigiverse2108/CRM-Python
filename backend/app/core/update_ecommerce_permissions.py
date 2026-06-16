import os
import pymysql
from pathlib import Path
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent.parent.parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "")
DB_NAME = os.getenv("DB_NAME", "enterprise_crm")

def main():
    print(f"[*] Connecting to database on {DB_HOST}:{DB_PORT}...")
    conn = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASS,
        database=DB_NAME,
        autocommit=True
    )
    cursor = conn.cursor()

    ecommerce_features = [
        ("ecommerce", "Orders Management", "/ecommerce/orders"),
        ("ecommerce", "Order Tracking", "/ecommerce/orders/track"),
        ("ecommerce", "Products List", "/ecommerce/products"),
        ("ecommerce", "Inventory Management", "/ecommerce/inventory"),
        ("ecommerce", "Abandoned Carts", "/ecommerce/abandoned"),
    ]

    cursor.execute("SELECT workspace_id FROM workspaces;")
    workspaces = [row[0] for row in cursor.fetchall()]

    print(f"[*] Seeding {len(ecommerce_features)} ecommerce features for {len(workspaces)} workspaces...")
    for ws_id in workspaces:
        for module, feature, link in ecommerce_features:
            cursor.execute("""
                INSERT IGNORE INTO workspace_permissions 
                (workspace_id, module, feature, link, can_add, can_edit, can_delete, can_view, can_full)
                VALUES (%s, %s, %s, %s, 1, 1, 1, 1, 1);
            """, (ws_id, module, feature, link))

    cursor.close()
    conn.close()
    print("[OK] Ecommerce features seeded successfully.")

if __name__ == "__main__":
    main()
