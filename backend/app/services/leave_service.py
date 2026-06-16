from typing import Any, Optional, Dict
from fastapi import HTTPException
from datetime import datetime, date, timezone

from backend.app.models.leave import Leave
from backend.app.repositories.leave_repo import LeaveRepository, get_leave_repository
from backend.app.repositories.employee_repo import get_employee_repository


class LeaveService:
    def __init__(self, leave_repo: LeaveRepository):
        self.leave_repo = leave_repo

    async def get_leave(self, leave_id: str, tenant_id: str) -> Dict[str, Any]:
        leave = await self.leave_repo.get_by_id(leave_id, tenant_id)
        if not leave:
            raise HTTPException(status_code=404, detail="Leave record not found")
        return leave.to_dict()

    async def list_leaves(
        self, tenant_id: str, filters: Optional[dict[str, Any]] = None, page: int = 1, per_page: int = 100
    ) -> Dict[str, Any]:
        skip = (page - 1) * per_page
        leaves = await self.leave_repo.get_all(tenant_id, filters, skip, per_page)
        total = await self.leave_repo.count(tenant_id, filters)
        return {
            "items": [lv.to_dict() for lv in leaves],
            "meta": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": (total + per_page - 1) // per_page if total > 0 else 0,
            },
        }

    async def create_leave_request(self, data: dict[str, Any], tenant_id: str) -> Dict[str, Any]:
        employee_id = data["employeeId"]
        emp_repo = get_employee_repository()
        employee = await emp_repo.get_by_id(employee_id, tenant_id)
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")

        start_date = data["startDate"]
        if isinstance(start_date, str):
            start_date = date.fromisoformat(start_date)

        end_date = data["endDate"]
        if isinstance(end_date, str):
            end_date = date.fromisoformat(end_date)

        # Calculate leaves days count if not supplied
        days = int(data.get("days") or (end_date - start_date).days + 1)

        leave = Leave(
            workspace_id=tenant_id,
            employee_id=employee_id,
            employee_name=employee.name,
            department=employee.department,
            type=data["type"],
            start_date=start_date,
            end_date=end_date,
            days=days,
            reason=data.get("reason"),
            status=data.get("status") or "Pending",
            day_type=data.get("dayType") or "Full Day",
            approved_by=data.get("approvedBy"),
            proof_of_leave=data.get("proofOfLeave"),
        )

        created = await self.leave_repo.create(leave)
        return created.to_dict()

    async def update_leave_status(self, leave_id: str, tenant_id: str, data: dict[str, Any]) -> Dict[str, Any]:
        leave = await self.leave_repo.get_by_id(leave_id, tenant_id)
        if not leave:
            raise HTTPException(status_code=404, detail="Leave record not found")

        updated = await self.leave_repo.update(leave_id, tenant_id, data)
        return updated.to_dict()

    async def delete_leave(self, leave_id: str, tenant_id: str) -> None:
        leave = await self.leave_repo.get_by_id(leave_id, tenant_id)
        if not leave:
            raise HTTPException(status_code=404, detail="Leave record not found")
        await self.leave_repo.delete(leave_id, tenant_id)


_leave_service = LeaveService(get_leave_repository())

def get_leave_service() -> LeaveService:
    return _leave_service
