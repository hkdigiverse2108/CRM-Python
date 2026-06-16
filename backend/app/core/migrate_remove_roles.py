import os
import pymysql
import uuid
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
    print(f"[*] Connecting to {DB_HOST}:{DB_PORT}...")
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

    # 1. Fetch all users who are NOT super admins or org admins
    # A user is an admin if their role_id ends with _super_admin_<ws> or _admin_001_<ws>
    cursor.execute("""
        SELECT user_id, workspace_id, role_id, full_name, email 
        FROM users 
        WHERE role_id NOT LIKE 'role_super_admin%' AND role_id NOT LIKE 'role_admin_001%';
    """)
    users_to_migrate = cursor.fetchall()
    print(f"[*] Found {len(users_to_migrate)} users to migrate to custom roles.")

    for user_id, workspace_id, old_role_id, full_name, email in users_to_migrate:
        # Check if the user already has a custom role
        new_role_id = f"role_custom_{user_id}"
        
        # Check if this role exists in roles table
        cursor.execute("SELECT 1 FROM roles WHERE role_id = %s;", (new_role_id,))
        role_exists = cursor.fetchone()
        
        if not role_exists:
            print(f"[+] Creating custom role for {full_name} ({email}) -> {new_role_id}")
            # Insert the custom role
            cursor.execute("""
                INSERT INTO roles (role_id, workspace_id, role_name, description, is_custom, status)
                VALUES (%s, %s, %s, %s, 1, 'active');
            """, (new_role_id, workspace_id, f"Role for {full_name}", f"User-specific custom role for {full_name} ({email})"))

            # Copy permissions from old role_permissions to this custom role_permissions
            cursor.execute("""
                SELECT module, can_view, can_create, can_edit, can_delete, can_export, can_import, can_approve, can_assign, can_archive, record_scope
                FROM role_permissions
                WHERE role_id = %s;
            """, (old_role_id,))
            old_permissions = cursor.fetchall()

            for module, cv, cc, ce, cd, cx, ci, ca, cas, car, scope in old_permissions:
                rp_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO role_permissions (id, role_id, module, can_view, can_create, can_edit, can_delete, can_export, can_import, can_approve, can_assign, can_archive, record_scope)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE 
                        can_view=VALUES(can_view), can_create=VALUES(can_create), can_edit=VALUES(can_edit),
                        can_delete=VALUES(can_delete), can_export=VALUES(can_export), can_import=VALUES(can_import),
                        can_approve=VALUES(can_approve), can_assign=VALUES(can_assign), can_archive=VALUES(can_archive),
                        record_scope=VALUES(record_scope);
                """, (rp_id, new_role_id, module, cv, cc, ce, cd, cx, ci, ca, cas, car, scope))

        # Update the user's role_id to the new custom role_id
        cursor.execute("UPDATE users SET role_id = %s WHERE user_id = %s;", (new_role_id, user_id))

    # 2. Delete all default roles other than super_admin and admin_001
    print("[*] Deleting non-admin predefined roles from roles table...")
    cursor.execute("""
        DELETE FROM roles 
        WHERE is_custom = 0 
          AND role_id NOT LIKE 'role_super_admin%' 
          AND role_id NOT LIKE 'role_admin_001%';
    """)
    print(f"[+] Deleted {cursor.rowcount} predefined role records.")

    # 3. Clean up workspace_roles table
    print("[*] Cleaning up workspace_roles table...")
    cursor.execute("""
        DELETE FROM workspace_roles 
        WHERE role_suffix NOT IN ('super_admin', 'admin_001');
    """)
    print(f"[+] Deleted {cursor.rowcount} workspace_roles records.")

    cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
    cursor.close()
    conn.close()
    print("[OK] Migration finished.")

if __name__ == "__main__":
    migrate()
