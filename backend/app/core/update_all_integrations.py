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

    all_27_integrations = [
        ("integrations", "Meta Platforms", "/admin/integrations/meta_platforms"),
        ("integrations", "Shopify Store", "/admin/integrations/shopify"),
        ("integrations", "WooCommerce Store", "/admin/integrations/woocommerce"),
        ("integrations", "Amazon Seller Central", "/admin/integrations/amazon"),
        ("integrations", "Flipkart Seller Hub", "/admin/integrations/flipkart"),
        ("integrations", "Myntra Seller Hub", "/admin/integrations/myntra"),
        ("integrations", "Meesho Supplier Hub", "/admin/integrations/meesho"),
        ("integrations", "WordPress REST API", "/admin/integrations/wordpress"),
        ("integrations", "Custom Website Webhooks", "/admin/integrations/custom_website"),
        ("integrations", "TallyPrime ERP Connector", "/admin/integrations/tally"),
        ("integrations", "JustDial Lead Sync", "/admin/integrations/justdial"),
        ("integrations", "IndiaMART Lead Manager", "/admin/integrations/indiamart"),
        ("integrations", "TradeIndia Lead Connector", "/admin/integrations/tradeindia"),
        ("integrations", "Razorpay Gateway", "/admin/integrations/razorpay"),
        ("integrations", "Stripe Gateway", "/admin/integrations/stripe"),
        ("integrations", "Cashfree Gateway", "/admin/integrations/cashfree"),
        ("integrations", "PayU Payments", "/admin/integrations/payu"),
        ("integrations", "PhonePe Gateway", "/admin/integrations/phonepe"),
        ("integrations", "Twilio Voice API", "/admin/integrations/twilio"),
        ("integrations", "Exotel Softphone API", "/admin/integrations/exotel"),
        ("integrations", "Knowlarity Telephony", "/admin/integrations/knowlarity"),
        ("integrations", "MSG91 Gateway", "/admin/integrations/msg91"),
        ("integrations", "TextLocal SMS API", "/admin/integrations/textlocal"),
        ("integrations", "SMTP Server", "/admin/integrations/smtp"),
        ("integrations", "SendGrid Email API", "/admin/integrations/sendgrid"),
        ("integrations", "Brevo (Sendinblue) Email", "/admin/integrations/brevo"),
        ("integrations", "Amazon SES Email", "/admin/integrations/amazon_ses")
    ]

    cursor.execute("SELECT workspace_id FROM workspaces;")
    workspaces = [row[0] for row in cursor.fetchall()]

    print(f"[*] Seeding {len(all_27_integrations)} integrations for {len(workspaces)} workspaces...")
    for ws_id in workspaces:
        for module, feature, link in all_27_integrations:
            cursor.execute("""
                INSERT IGNORE INTO workspace_permissions 
                (workspace_id, module, feature, link, can_add, can_edit, can_delete, can_view, can_full)
                VALUES (%s, %s, %s, %s, 1, 1, 1, 1, 1);
            """, (ws_id, module, feature, link))

    cursor.close()
    conn.close()
    print("[OK] All 27 integrations seeded successfully.")

if __name__ == "__main__":
    main()
