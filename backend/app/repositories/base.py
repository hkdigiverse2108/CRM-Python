"""
Base Repository Interface
==========================
Abstract base class defining the data access contract.
All concrete repositories must implement these methods.

Designed for future integration with:
  - PostgreSQL (via SQLAlchemy async)
  - MySQL (via SQLAlchemy async)
  - MongoDB (via Motor / MongoEngine)
"""

from abc import ABC, abstractmethod
from typing import Any, Generic, Optional, TypeVar

T = TypeVar("T")


class BaseRepository(ABC, Generic[T]):
    """
    Abstract repository defining standard CRUD operations.
    
    Type parameter T represents the domain model class.
    Concrete implementations will replace in-memory stubs
    with actual database queries.
    """

    @abstractmethod
    async def get_by_id(self, entity_id: str, tenant_id: str) -> Optional[T]:
        """Retrieve a single entity by its ID within a tenant scope."""
        ...

    @abstractmethod
    async def get_all(
        self,
        tenant_id: str,
        filters: Optional[dict[str, Any]] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> list[T]:
        """Retrieve a paginated list of entities within a tenant scope."""
        ...

    @abstractmethod
    async def create(self, entity: T) -> T:
        """Persist a new entity and return it."""
        ...

    @abstractmethod
    async def update(self, entity_id: str, tenant_id: str, data: dict[str, Any]) -> Optional[T]:
        """Update an existing entity by ID. Returns updated entity or None."""
        ...

    @abstractmethod
    async def delete(self, entity_id: str, tenant_id: str) -> bool:
        """Delete an entity by ID. Returns True if deleted, False if not found."""
        ...

    @abstractmethod
    async def count(self, tenant_id: str, filters: Optional[dict[str, Any]] = None) -> int:
        """Count entities matching optional filters within a tenant scope."""
        ...
