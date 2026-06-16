import os
import pymysql
import uuid
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

    # 1. Update roles table: Add is_custom if it doesn't exist
    print("[*] Checking roles table columns...")
    cursor.execute("DESCRIBE roles;")
    columns = [col[0] for col in cursor.fetchall()]
    if "is_custom" not in columns:
        print("[+] Adding is_custom column to roles table...")
        cursor.execute("ALTER TABLE roles ADD COLUMN is_custom TINYINT(1) DEFAULT 1;")

    # 2. Re-create role_permissions table
    print("[*] Recreating role_permissions table...")
    cursor.execute("DROP TABLE IF EXISTS role_permissions;")
    cursor.execute("""
    CREATE TABLE role_permissions (
        id VARCHAR(36) NOT NULL,
        role_id VARCHAR(36) NOT NULL,
        module VARCHAR(100) NOT NULL,
        can_view TINYINT(1) DEFAULT 0,
        can_create TINYINT(1) DEFAULT 0,
        can_edit TINYINT(1) DEFAULT 0,
        can_delete TINYINT(1) DEFAULT 0,
        can_export TINYINT(1) DEFAULT 0,
        can_import TINYINT(1) DEFAULT 0,
        can_approve TINYINT(1) DEFAULT 0,
        can_assign TINYINT(1) DEFAULT 0,
        can_archive TINYINT(1) DEFAULT 0,
        record_scope VARCHAR(50) DEFAULT 'all', -- 'own', 'team', 'department', 'all'
        PRIMARY KEY (id),
        UNIQUE KEY idx_role_module (role_id, module),
        CONSTRAINT fk_rp_role FOREIGN KEY (role_id) 
            REFERENCES roles (role_id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)

    # 3. Create audit_logs table
    print("[*] Creating audit_logs table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        log_id VARCHAR(36) NOT NULL PRIMARY KEY,
        workspace_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        action VARCHAR(100) NOT NULL,
        module VARCHAR(100) NULL,
        record_id VARCHAR(100) NULL,
        details TEXT NULL,
        ip_address VARCHAR(50) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)

    # 4. Fetch all workspaces to seed default roles and permissions
    cursor.execute("SELECT workspace_id FROM workspaces;")
    workspaces = [row[0] for row in cursor.fetchall()]
    if not workspaces:
        # Fallback to default if no workspaces exist yet
        workspaces = ["rapidmodel_corp"]

    # 5. Define default roles and their permissions
    # We will seed these for every workspace
    default_roles_info = [
        # SUPER ADMIN (Special global role or workspace-specific Org Admin)
        {
            "role_suffix": "super_admin",
            "name": "Super Admin",
            "description": "Full Platform Access and Management",
            "is_custom": 0,
            "permissions": [
                {"module": "organizations", "view": 1, "create": 1, "edit": 1, "delete": 1, "export": 1, "import": 1, "approve": 1, "assign": 1, "archive": 1, "scope": "all"},
                {"module": "resellers", "view": 1, "create": 1, "edit": 1, "delete": 1, "export": 1, "import": 1, "approve": 1, "assign": 1, "archive": 1, "scope": "all"},
                {"module": "plans", "view": 1, "create": 1, "edit": 1, "delete": 1, "export": 1, "import": 1, "approve": 1, "assign": 1, "archive": 1, "scope": "all"},
                {"module": "billing", "view": 1, "create": 1, "edit": 1, "delete": 1, "export": 1, "import": 1, "approve": 1, "assign": 1, "archive": 1, "scope": "all"},
                {"module": "global_reports", "view": 1, "create": 1, "edit": 1, "delete": 1, "export": 1, "import": 1, "approve": 1, "assign": 1, "archive": 1, "scope": "all"},
                {"module": "global_analytics", "view": 1, "create": 1, "edit": 1, "delete": 1, "export": 1, "import": 1, "approve": 1, "assign": 1, "archive": 1, "scope": "all"},
                {"module": "users", "view": 1, "create": 1, "edit": 1, "delete": 1, "export": 1, "import": 1, "approve": 1, "assign": 1, "archive": 1, "scope": "all"},
                {"module": "white_label", "view": 1, "create": 1, "edit": 1, "delete": 1, "export": 1, "import": 1, "approve": 1, "assign": 1, "archive": 1, "scope": "all"},
                {"module": "integrations", "view": 1, "create": 1, "edit": 1, "delete": 1, "export": 1, "import": 1, "approve": 1, "assign": 1, "archive": 1, "scope": "all"},
                {"module": "settings", "view": 1, "create": 1, "edit": 1, "delete": 1, "export": 1, "import": 1, "approve": 1, "assign": 1, "archive": 1, "scope": "all"},
                {"module": "audit_logs", "view": 1, "create": 1, "edit": 1, "delete": 1, "export": 1, "import": 1, "approve": 1, "assign": 1, "archive": 1, "scope": "all"},
            ]
        },
        # ORGANIZATION ADMIN
        {
            "role_suffix": "admin_001",
            "name": "Organization Admin",
            "description": "Full Access Within Organization",
            "is_custom": 0,
            "permissions": [
                {"module": "dashboard", "view": 1, "create": 1, "edit": 1, "delete": 1, "export": 1, "import": 1, "approve": 1, "assign": 1, "archive": 1, "scope": "all"},
                {"module": "crm", "view": 1, "create": 1, "edit": 1, "delete": 1, "export": 1, "import": 1, "approve": 1, "assign": 1, "archive": 1, "scope": "all"},
                {"module": "sales", "view": 1, "create": 1, "edit": 1, "delete": 1, "export": 1, "import": 1, "approve": 1, "assign": 1, "archive": 1, "scope": "all"},
                {"module": "whatsapp", "view": 1, "create": 1, "edit": 1, "delete": 1, "export": 1, "import": 1, "approve": 1, "assign": 1, "archive": 1, "scope": "all"},
                {"module": "marketing", "view": 1, "create": 1, "edit": 1, "delete": 1, "export": 1, "import": 1, "approve": 1, "assign": 1, "archive": 1, "scope": "all"},
                {"module": "automation", "view": 1, "create": 1, "edit": 1, "delete": 1, "export": 1, "import": 1, "approve": 1, "assign": 1, "archive": 1, "scope": "all"},
                {"module": "finance", "view": 1, "create": 1, "edit": 1, "delete": 1, "export": 1, "import": 1, "approve": 1, "assign": 1, "archive": 1, "scope": "all"},
                {"module": "hrms", "view": 1, "create": 1, "edit": 1, "delete": 1, "export": 1, "import": 1, "approve": 1, "assign": 1, "archive": 1, "scope": "all"},
                {"module": "support", "view": 1, "create": 1, "edit": 1, "delete": 1, "export": 1, "import": 1, "approve": 1, "assign": 1, "archive": 1, "scope": "all"},
                {"module": "projects", "view": 1, "create": 1, "edit": 1, "delete": 1, "export": 1, "import": 1, "approve": 1, "assign": 1, "archive": 1, "scope": "all"},
                {"module": "reports", "view": 1, "create": 1, "edit": 1, "delete": 1, "export": 1, "import": 1, "approve": 1, "assign": 1, "archive": 1, "scope": "all"},
                {"module": "settings", "view": 1, "create": 1, "edit": 1, "delete": 1, "export": 1, "import": 1, "approve": 1, "assign": 1, "archive": 1, "scope": "all"},
                {"module": "users", "view": 1, "create": 1, "edit": 1, "delete": 1, "export": 1, "import": 1, "approve": 1, "assign": 1, "archive": 1, "scope": "all"},
                {"module": "audit_logs", "view": 1, "create": 1, "edit": 1, "delete": 1, "export": 1, "import": 1, "approve": 1, "assign": 1, "archive": 1, "scope": "all"},
            ]
        },
        # SALES MANAGER
        {
            "role_suffix": "mgr_001",
            "name": "Sales Manager",
            "description": "Sales Management & Team Reports",
            "is_custom": 0,
            "permissions": [
                {"module": "dashboard", "view": 1, "create": 0, "edit": 0, "delete": 0, "export": 0, "import": 0, "approve": 0, "assign": 0, "archive": 0, "scope": "team"},
                {"module": "crm", "view": 1, "create": 1, "edit": 1, "delete": 0, "export": 1, "import": 1, "approve": 0, "assign": 1, "archive": 0, "scope": "team"},
                {"module": "sales", "view": 1, "create": 1, "edit": 1, "delete": 0, "export": 1, "import": 1, "approve": 0, "assign": 1, "archive": 0, "scope": "team"},
                {"module": "projects", "view": 1, "create": 1, "edit": 1, "delete": 0, "export": 0, "import": 0, "approve": 0, "assign": 1, "archive": 0, "scope": "team"},
                {"module": "reports", "view": 1, "create": 0, "edit": 0, "delete": 0, "export": 1, "import": 0, "approve": 0, "assign": 0, "archive": 0, "scope": "team"},
            ]
        },
        # SALES EXECUTIVE
        {
            "role_suffix": "agent_001",
            "name": "Sales Executive",
            "description": "Assigned Lead Follow-ups & Direct Sales",
            "is_custom": 0,
            "permissions": [
                {"module": "dashboard", "view": 1, "create": 0, "edit": 0, "delete": 0, "export": 0, "import": 0, "approve": 0, "assign": 0, "archive": 0, "scope": "own"},
                {"module": "crm", "view": 1, "create": 1, "edit": 1, "delete": 0, "export": 0, "import": 0, "approve": 0, "assign": 0, "archive": 0, "scope": "own"},
                {"module": "whatsapp", "view": 1, "create": 1, "edit": 1, "delete": 0, "export": 0, "import": 0, "approve": 0, "assign": 0, "archive": 0, "scope": "own"},
                {"module": "projects", "view": 1, "create": 0, "edit": 1, "delete": 0, "export": 0, "import": 0, "approve": 0, "assign": 0, "archive": 0, "scope": "own"},
            ]
        },
        # MARKETING MANAGER
        {
            "role_suffix": "marketing_mgr",
            "name": "Marketing Manager",
            "description": "Campaign Planning and Marketing Analytics",
            "is_custom": 0,
            "permissions": [
                {"module": "dashboard", "view": 1, "create": 0, "edit": 0, "delete": 0, "export": 0, "import": 0, "approve": 0, "assign": 0, "archive": 0, "scope": "all"},
                {"module": "marketing", "view": 1, "create": 1, "edit": 1, "delete": 1, "export": 1, "import": 1, "approve": 1, "assign": 1, "archive": 1, "scope": "all"},
                {"module": "automation", "view": 1, "create": 1, "edit": 1, "delete": 1, "export": 0, "import": 0, "approve": 1, "assign": 0, "archive": 0, "scope": "all"},
                {"module": "reports", "view": 1, "create": 0, "edit": 0, "delete": 0, "export": 1, "import": 0, "approve": 0, "assign": 0, "archive": 0, "scope": "all"},
            ]
        },
        # MARKETING EXECUTIVE
        {
            "role_suffix": "marketing_exec",
            "name": "Marketing Executive",
            "description": "Campaign Execution and Template Management",
            "is_custom": 0,
            "permissions": [
                {"module": "marketing", "view": 1, "create": 1, "edit": 1, "delete": 0, "export": 0, "import": 0, "approve": 0, "assign": 0, "archive": 0, "scope": "all"},
            ]
        },
        # HR MANAGER
        {
            "role_suffix": "hr_mgr",
            "name": "HR Manager",
            "description": "Manage Directory, Payroll & Leave Approvals",
            "is_custom": 0,
            "permissions": [
                {"module": "dashboard", "view": 1, "create": 0, "edit": 0, "delete": 0, "export": 0, "import": 0, "approve": 0, "assign": 0, "archive": 0, "scope": "all"},
                {"module": "hrms", "view": 1, "create": 1, "edit": 1, "delete": 1, "export": 1, "import": 1, "approve": 1, "assign": 1, "archive": 1, "scope": "all"},
            ]
        },
        # HR EXECUTIVE
        {
            "role_suffix": "hr_exec",
            "name": "HR Executive",
            "description": "Manage Attendance & Record Creation",
            "is_custom": 0,
            "permissions": [
                {"module": "hrms", "view": 1, "create": 1, "edit": 1, "delete": 0, "export": 0, "import": 0, "approve": 0, "assign": 0, "archive": 0, "scope": "all"},
            ]
        },
        # ACCOUNTANT
        {
            "role_suffix": "accountant_001",
            "name": "Accountant",
            "description": "Invoice Generation & Revenue Ledger Tracking",
            "is_custom": 0,
            "permissions": [
                {"module": "dashboard", "view": 1, "create": 0, "edit": 0, "delete": 0, "export": 0, "import": 0, "approve": 0, "assign": 0, "archive": 0, "scope": "all"},
                {"module": "finance", "view": 1, "create": 1, "edit": 1, "delete": 0, "export": 1, "import": 1, "approve": 1, "assign": 0, "archive": 0, "scope": "all"},
            ]
        },
        # SUPPORT MANAGER
        {
            "role_suffix": "support_mgr",
            "name": "Support Manager",
            "description": "Ticketing Queue & Escalation Management",
            "is_custom": 0,
            "permissions": [
                {"module": "dashboard", "view": 1, "create": 0, "edit": 0, "delete": 0, "export": 0, "import": 0, "approve": 0, "assign": 0, "archive": 0, "scope": "all"},
                {"module": "support", "view": 1, "create": 1, "edit": 1, "delete": 1, "export": 1, "import": 1, "approve": 1, "assign": 1, "archive": 1, "scope": "all"},
            ]
        },
        # SUPPORT EXECUTIVE
        {
            "role_suffix": "support_001",
            "name": "Support Executive",
            "description": "Resolve Customer Support Queries & Shared Inbox",
            "is_custom": 0,
            "permissions": [
                {"module": "support", "view": 1, "create": 0, "edit": 1, "delete": 0, "export": 0, "import": 0, "approve": 0, "assign": 0, "archive": 0, "scope": "own"},
            ]
        },
        # PROJECT MANAGER
        {
            "role_suffix": "project_mgr",
            "name": "Project Manager",
            "description": "Create projects, assign tasks, and track team gantt progress",
            "is_custom": 0,
            "permissions": [
                {"module": "projects", "view": 1, "create": 1, "edit": 1, "delete": 1, "export": 1, "import": 1, "approve": 1, "assign": 1, "archive": 1, "scope": "team"},
            ]
        },
        # TEAM MEMBER
        {
            "role_suffix": "team_member",
            "name": "Team Member",
            "description": "View assigned tasks and log project hours",
            "is_custom": 0,
            "permissions": [
                {"module": "projects", "view": 1, "create": 0, "edit": 1, "delete": 0, "export": 0, "import": 0, "approve": 0, "assign": 0, "archive": 0, "scope": "own"},
            ]
        },
        # OPERATIONS MANAGER
        {
            "role_suffix": "operations_mgr",
            "name": "Operations Manager",
            "description": "Manage warehouse logistics and track inventory movement logs",
            "is_custom": 0,
            "permissions": [
                {"module": "projects", "view": 1, "create": 1, "edit": 1, "delete": 0, "export": 1, "import": 0, "approve": 0, "assign": 1, "archive": 0, "scope": "all"},
            ]
        },
        # INVENTORY MANAGER
        {
            "role_suffix": "inventory_mgr",
            "name": "Inventory Manager",
            "description": "Track products listings and handle restock orders",
            "is_custom": 0,
            "permissions": [
                {"module": "projects", "view": 1, "create": 1, "edit": 1, "delete": 0, "export": 1, "import": 1, "approve": 0, "assign": 0, "archive": 0, "scope": "all"},
            ]
        },
        # CALL CENTER AGENT
        {
            "role_suffix": "call_center_agent",
            "name": "Call Center Agent",
            "description": "Manage call dials and log leads outcomes",
            "is_custom": 0,
            "permissions": [
                {"module": "crm", "view": 1, "create": 0, "edit": 1, "delete": 0, "export": 0, "import": 0, "approve": 0, "assign": 0, "archive": 0, "scope": "own"},
            ]
        },
        # WHATSAPP AGENT
        {
            "role_suffix": "whatsapp_agent",
            "name": "WhatsApp Agent",
            "description": "Access Shared Chats Inbox and send Templates",
            "is_custom": 0,
            "permissions": [
                {"module": "whatsapp", "view": 1, "create": 1, "edit": 1, "delete": 0, "export": 0, "import": 0, "approve": 0, "assign": 0, "archive": 0, "scope": "all"},
            ]
        },
        # RECEPTIONIST
        {
            "role_suffix": "receptionist",
            "name": "Receptionist",
            "description": "Create booking contacts and schedule appointments",
            "is_custom": 0,
            "permissions": [
                {"module": "crm", "view": 1, "create": 1, "edit": 1, "delete": 0, "export": 0, "import": 0, "approve": 0, "assign": 0, "archive": 0, "scope": "all"},
            ]
        }
    ]

    print("[*] Seeding default roles and permissions for each workspace...")
    for ws_id in workspaces:
        print(f"  -> Seeding roles for workspace: {ws_id}")
        for r_info in default_roles_info:
            role_id = f"role_{r_info['role_suffix']}_{ws_id}"
            
            # Insert role (ignore if duplicate)
            cursor.execute("""
            INSERT IGNORE INTO roles (role_id, workspace_id, role_name, description, is_custom)
            VALUES (%s, %s, %s, %s, %s);
            """, (role_id, ws_id, r_info["name"], r_info["description"], r_info["is_custom"]))

            # Insert permissions
            for p in r_info["permissions"]:
                rp_id = str(uuid.uuid4())
                cursor.execute("""
                INSERT INTO role_permissions (
                    id, role_id, module, can_view, can_create, can_edit, can_delete,
                    can_export, can_import, can_approve, can_assign, can_archive, record_scope
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                ) ON DUPLICATE KEY UPDATE
                    can_view = VALUES(can_view),
                    can_create = VALUES(can_create),
                    can_edit = VALUES(can_edit),
                    can_delete = VALUES(can_delete),
                    can_export = VALUES(can_export),
                    can_import = VALUES(can_import),
                    can_approve = VALUES(can_approve),
                    can_assign = VALUES(can_assign),
                    can_archive = VALUES(can_archive),
                    record_scope = VALUES(record_scope);
                """, (
                    rp_id, role_id, p["module"], p["view"], p["create"], p["edit"], p["delete"],
                    p["export"], p["import"], p["approve"], p["assign"], p["archive"], p["scope"]
                ))

    # Re-enable foreign key checks
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
    print("[+] Dynamic RBAC migration run successfully!")
    conn.close()

if __name__ == "__main__":
    migrate()
