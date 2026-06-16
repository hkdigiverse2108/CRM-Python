import os
import pymysql
from pathlib import Path
from dotenv import load_dotenv

# Resolve root .env path relative to this script
ENV_PATH = Path(__file__).resolve().parent.parent.parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "")
DB_NAME = os.getenv("DB_NAME", "enterprise_crm")

def migrate():
    print(f"[*] Connecting to MySQL server at {DB_HOST}:{DB_PORT}...")
    conn = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASS,
        database=DB_NAME,
        autocommit=True
    )
    cursor = conn.cursor()

    # Disable foreign key checks for schema changes
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")

    # Define the FULLTEXT indexes to create
    indexes = [
        ("leads", "ft_leads", "full_name, email, phone_primary, company_name"),
        ("contacts", "ft_contacts", "name, email, company, phone"),
        ("clients", "ft_clients", "name, email, phone, industry, owner_name"),
        ("ecommerce_products", "ft_ecommerce_products", "name, sku, category, brand, description"),
        ("finance_quotes", "ft_finance_quotes", "client, product_name"),
        ("finance_invoices", "ft_finance_invoices", "client"),
        ("hrms_employees", "ft_hrms_employees", "name, email, role"),
        ("projects", "ft_projects", "name, description")
    ]

    for table, idx_name, cols in indexes:
        print(f"[*] Checking index {idx_name} on table {table}...")
        cursor.execute(f"SHOW INDEX FROM {table} WHERE Key_name = '{idx_name}';")
        if not cursor.fetchall():
            print(f"[+] Creating FULLTEXT index {idx_name} on table {table}({cols})...")
            try:
                cursor.execute(f"ALTER TABLE {table} ADD FULLTEXT INDEX {idx_name} ({cols});")
                print(f"[OK] Created index {idx_name} successfully.")
            except Exception as e:
                print(f"[!] Error creating index {idx_name}: {e}")
        else:
            print(f"[~] Index {idx_name} already exists. Skipping.")

    cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
    cursor.close()
    conn.close()
    print("[*] Migration completed successfully.")

if __name__ == "__main__":
    migrate()
