"""
User Service
=============
Business logic for user CRUD operations.
"""

from typing import Any, Optional

from backend.app.models.user import User
from backend.app.core.security import hash_password
from backend.app.repositories.user_repo import UserRepository, get_user_repository
from backend.app.utils.exceptions import ConflictException, NotFoundException


class UserService:
    """User management business logic."""

    def __init__(self, user_repo: UserRepository | None = None) -> None:
        self._repo = user_repo or get_user_repository()

    async def get_user(self, user_id: str, tenant_id: str) -> dict:
        user = await self._repo.get_by_id(user_id, tenant_id)
        if user is None:
            raise NotFoundException(f"User '{user_id}' not found")
        return user.to_dict()

    async def list_users(
        self, tenant_id: str, filters: Optional[dict[str, Any]] = None,
        page: int = 1, per_page: int = 20,
    ) -> dict:
        skip = (page - 1) * per_page
        users = await self._repo.get_all(tenant_id, filters, skip=skip, limit=per_page)
        total = await self._repo.count(tenant_id, filters)

        return {
            "items": [u.to_dict() for u in users],
            "meta": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "total_pages": (total + per_page - 1) // per_page,
            },
        }

    async def create_user(self, data: dict[str, Any], tenant_id: str) -> dict:
        existing = await self._repo.get_by_email(data["email"], tenant_id)
        if existing:
            raise ConflictException(f"Email '{data['email']}' already registered")

        user = User(
            email=data["email"],
            hashed_password=hash_password(data["password"]),
            full_name=data["full_name"],
            role=data.get("role", "agent"),
            tenant_id=tenant_id,
            phone=data.get("phone"),
        )
        created = await self._repo.create(user)
        return created.to_dict()

    async def update_user(self, user_id: str, tenant_id: str, data: dict[str, Any]) -> dict:
        updated = await self._repo.update(user_id, tenant_id, data)
        if updated is None:
            raise NotFoundException(f"User '{user_id}' not found")
        return updated.to_dict()

    async def delete_user(self, user_id: str, tenant_id: str) -> bool:
        deleted = await self._repo.delete(user_id, tenant_id)
        if not deleted:
            raise NotFoundException(f"User '{user_id}' not found")
        return True


_user_service = UserService()

def get_user_service() -> UserService:
    return _user_service
