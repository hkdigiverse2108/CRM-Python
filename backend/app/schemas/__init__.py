# Pydantic schemas for request/response validation
from backend.app.schemas.employee import EmployeeCreate, EmployeeUpdate
from backend.app.schemas.attendance import AttendanceCreate, AttendanceUpdate
from backend.app.schemas.leave import LeaveCreate, LeaveUpdate
from backend.app.schemas.payroll import PayrollCreate, PayrollUpdate
from backend.app.schemas.task import TaskCreate, TaskUpdate
from backend.app.schemas.reminder import ReminderCreate, ReminderUpdate
from backend.app.schemas.role import RoleCreate, RoleUpdate, RolePermissionSchema
