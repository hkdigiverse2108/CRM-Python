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

def migrate():
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

    cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")

    # 1. Create workspace_permissions table
    print("[*] Creating workspace_permissions table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS workspace_permissions (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        workspace_id VARCHAR(36) NOT NULL,
        module VARCHAR(50) NOT NULL,
        feature VARCHAR(100) NOT NULL,
        link VARCHAR(255) NULL,
        can_add TINYINT(1) DEFAULT 0,
        can_edit TINYINT(1) DEFAULT 0,
        can_delete TINYINT(1) DEFAULT 0,
        can_view TINYINT(1) DEFAULT 0,
        can_full TINYINT(1) DEFAULT 0,
        updated_by VARCHAR(36) NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_ws_mod_feat (workspace_id, module, feature),
        CONSTRAINT fk_ws_perm_workspace FOREIGN KEY (workspace_id) 
            REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)

    # 2. Define standard features blueprint
    features_blueprint = [
        # Dashboard
        ("dashboard", "Main KPI", "/"),
        ("dashboard", "Sales Dashboard", "/dashboard/sales"),
        ("dashboard", "Team Dashboard", "/dashboard/team"),
        ("dashboard", "Analytics Dashboard", "/dashboard/analytics"),
        # CRM
        ("crm", "Leads Management", "/crm/leads"),
        ("crm", "Contacts Directory", "/crm/contacts"),
        ("crm", "Clients List", "/crm/clients"),
        ("crm", "Pipeline Board", "/crm/pipeline"),
        # Sales
        ("sales", "Sales Pipeline", "/crm/pipeline"),
        ("sales", "Sales Targets", "/dashboard/sales"),
        # WhatsApp
        ("whatsapp", "WhatsApp Chat Inbox", "/omnichannel/whatsapp"),
        ("whatsapp", "WhatsApp Automation", "/omnichannel/whatsapp/automation"),
        # Marketing
        ("marketing", "Email & SMS Campaigns", "/marketing/campaigns"),
        ("marketing", "Marketing Analytics", "/marketing/analytics"),
        # Automation
        ("automation", "Automation Workflows", "/automation/workflows"),
        # Finance
        ("finance", "Billing Dashboard", "/finance/billing"),
        ("finance", "Invoices Management", "/finance/invoices"),
        ("finance", "Quotes Builder", "/finance/quotes"),
        ("finance", "Payments Tracker", "/finance/payments"),
        ("finance", "General Ledger", "/finance/ledger"),
        ("finance", "Expense Tracker", "/finance/expenses"),
        ("finance", "GST Reports", "/finance/gst"),
        # HRMS
        ("hrms", "HR Dashboard", "/hrms/dashboard"),
        ("hrms", "Employee Directory", "/hrms/directory"),
        ("hrms", "Attendance Tracker", "/hrms/attendance"),
        ("hrms", "Leaves Management", "/hrms/leaves"),
        ("hrms", "Payroll Processor", "/hrms/payroll"),
        # Support
        ("support", "Support Tickets", "/support/tickets"),
        ("support", "Knowledge Base", "/support/kb"),
        # Projects
        ("projects", "Project Dashboard", "/projects/dashboard"),
        ("projects", "Projects List", "/projects/all"),
        ("projects", "Pipeline Board", "/projects/pipeline"),
        ("projects", "Gantt Chart", "/projects/gantt"),
        ("projects", "Project Reports", "/projects/reports"),
        # Reports
        ("reports", "Advanced Reports", "/reports/advanced"),
        # E-Commerce
        ("ecommerce", "Orders Management", "/ecommerce/orders"),
        ("ecommerce", "Order Tracking", "/ecommerce/orders/track"),
        ("ecommerce", "Products List", "/ecommerce/products"),
        ("ecommerce", "Inventory Management", "/ecommerce/inventory"),
        ("ecommerce", "Abandoned Carts", "/ecommerce/abandoned"),
        # Settings
        ("settings", "White Label Settings", "/admin/whitelabel"),
        ("settings", "API Management", "/admin/api"),
        ("settings", "Appearance & Theme", "/admin/appearance"),
        # Users
        ("users", "User Management", "/admin/users"),
        ("users", "Roles & Permissions", "/admin/roles"),
        # Audit Logs
        ("audit_logs", "Audit Logs", "/admin/audit-logs"),
        # Integrations
        ("integrations", "Shopify Sync", "/admin/integrations/shopify"),
        ("integrations", "WhatsApp Integration", "/admin/integrations/whatsapp"),
        ("integrations", "Amazon Sync", "/admin/integrations/amazon"),
        ("integrations", "Flipkart Sync", "/admin/integrations/flipkart"),
        ("integrations", "Meta Leads Sync", "/admin/integrations/meta"),
        ("integrations", "Stripe Payments Gateway", "/admin/integrations/stripe"),
        ("integrations", "Google Suite Sync", "/admin/integrations/google")
    ]

    # 3. Seed features for existing workspaces
    print("[*] Seeding default feature permissions for existing workspaces...")
    cursor.execute("SELECT workspace_id FROM workspaces;")
    workspaces = [row[0] for row in cursor.fetchall()]

    for ws_id in workspaces:
        for module, feature, link in features_blueprint:
            cursor.execute("""
                INSERT IGNORE INTO workspace_permissions 
                (workspace_id, module, feature, link, can_add, can_edit, can_delete, can_view, can_full)
                VALUES (%s, %s, %s, %s, 1, 1, 1, 1, 1);
            """, (ws_id, module, feature, link))

    cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
    cursor.close()
    conn.close()
    print("[OK] Migration completed successfully.")

if __name__ == "__main__":
    migrate()
