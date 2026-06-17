import sqlite3
import json

conn = sqlite3.connect('backend/app.db')
conn.row_factory = sqlite3.Row
employees = [dict(r) for r in conn.execute("SELECT * FROM employees WHERE workspace_id = '96722'")]
for emp in employees:
    print(f"Name: {emp['name']}")
    print(f"Salary Structure: {emp['salaryStructure']}")
    print("-" * 50)
conn.close()
