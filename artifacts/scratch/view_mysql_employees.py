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
        cursor.execute("SELECT * FROM hrms_employees WHERE workspace_id = '96722'")
        employees = cursor.fetchall()
        for emp in employees:
            print(f"Employee ID/Key: {emp.get('employee_id') or emp.get('employeeId') or emp.get('id')}")
            print(f"Name: {emp.get('name')}")
            print(f"Salary Structure: {emp.get('salaryStructure') or emp.get('salary_structure')}")
            print("-" * 50)
finally:
    conn.close()
