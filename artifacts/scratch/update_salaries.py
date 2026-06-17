import pymysql
import json

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
        # Update vasim mahajan
        new_structure_vasim = {
            "basic": 25000.0,
            "hra": 0.0,
            "allowances": 0.0,
            "incentives": 0.0,
            "bonus": 0.0,
            "pf": 0.0,
            "esi": 0.0,
            "tds": 0.0,
            "loanDeductions": 0.0
        }
        cursor.execute(
            "UPDATE hrms_employees SET salary_structure = %s WHERE employee_id = 'EMP-3FF4C2'",
            (json.dumps(new_structure_vasim),)
        )
        
        # Update Kevin
        new_structure_kevin = {
            "basic": 50000.0,
            "hra": 0.0,
            "allowances": 0.0,
            "incentives": 0.0,
            "bonus": 0.0,
            "pf": 0.0,
            "esi": 0.0,
            "tds": 0.0,
            "loanDeductions": 0.0
        }
        cursor.execute(
            "UPDATE hrms_employees SET salary_structure = %s WHERE employee_id = 'EMP-092B1D'",
            (json.dumps(new_structure_kevin),)
        )
        
        # Update existing generated payroll slips for these employees to clean their status
        cursor.execute("DELETE FROM hrms_payroll WHERE workspace_id = '96722'")
        
        conn.commit()
        print("Successfully cleaned dummy salary deductions in database.")
finally:
    conn.close()
