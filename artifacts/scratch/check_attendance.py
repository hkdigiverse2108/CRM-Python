import pymysql
conn = pymysql.connect(host='127.0.0.1', port=3307, user='root', password='', database='enterprise_crm')
curr = conn.cursor(pymysql.cursors.DictCursor)
curr.execute("select * from hrms_attendance where employee_id = 'EMP-3FF4C2'")
print(curr.fetchall())
conn.close()
