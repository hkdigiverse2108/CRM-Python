import pymysql

conn = pymysql.connect(
    host='127.0.0.1',
    port=3307,
    user='root',
    password='',
    database='enterprise_crm',
    cursorclass=pymysql.cursors.DictCursor
)

try:
    with conn.cursor() as cursor:
        cursor.execute("SELECT * FROM hrms_payroll_adjustments WHERE workspace_id = '96722'")
        adjustments = cursor.fetchall()
        print("Adjustments in DB:")
        for adj in adjustments:
            print(adj)
        
        # Clean them up
        cursor.execute("DELETE FROM hrms_payroll_adjustments WHERE workspace_id = '96722'")
        conn.commit()
        print("Successfully deleted dummy adjustments.")
finally:
    conn.close()
