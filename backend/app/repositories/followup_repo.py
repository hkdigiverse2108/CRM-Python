"""
Lead Followup Repository
========================
MySQL database implementation of lead followup data access.
"""

import uuid
from datetime import datetime, timezone, date, time
from typing import Any, Optional
import anyio
from sqlalchemy import text

from backend.app.models.followup import LeadFollowup
from backend.app.repositories.base import BaseRepository
from backend.app.core.database import get_db


class LeadFollowupRepository(BaseRepository[LeadFollowup]):
    """
    MySQL database repository for Lead Followups.
    Filters all queries by workspace_id to guarantee tenant data isolation.
    """

    def _row_to_followup(self, row: dict[str, Any]) -> LeadFollowup:
        """Helper to construct a LeadFollowup domain model from a database row."""
        followup_date = row.get("followup_date")
        if isinstance(followup_date, str):
            followup_date = date.fromisoformat(followup_date)

        next_followup_date = row.get("next_followup_date")
        if isinstance(next_followup_date, str):
            next_followup_date = date.fromisoformat(next_followup_date)

        followup_time = row.get("followup_time")
        if isinstance(followup_time, str):
            # Parse time string
            parts = followup_time.split(":")
            followup_time = time(int(parts[0]), int(parts[1]))

        created_at = row.get("created_at")
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        elif created_at and not created_at.tzinfo:
            created_at = created_at.replace(tzinfo=timezone.utc)

        return LeadFollowup(
            id=row["id"],
            workspace_id=row["workspace_id"],
            lead_id=row["lead_id"],
            followup_date=followup_date or datetime.utcnow().date(),
            followup_time=followup_time,
            followup_type=row.get("followup_type", "Call"),
            remarks=row.get("remarks") or "",
            status=row.get("status") or "Completed",
            created_by=row.get("created_by"),
            created_at=created_at or datetime.now(timezone.utc),
            next_followup_date=next_followup_date,
            next_followup_remarks=row.get("next_followup_remarks"),
        )

    async def get_by_id(self, entity_id: str, tenant_id: str) -> Optional[LeadFollowup]:
        def _get():
            with get_db() as db:
                sql = text("""
                    SELECT * FROM lead_followups 
                    WHERE id = :id AND workspace_id = :workspace_id
                """)
                res = db.execute(sql, {"id": entity_id, "workspace_id": tenant_id}).mappings().first()
                if not res:
                    return None
                return self._row_to_followup(res)
        return await anyio.to_thread.run_sync(_get)

    async def get_all(
        self, tenant_id: str, filters: Optional[dict[str, Any]] = None,
        skip: int = 0, limit: int = 20,
    ) -> list[LeadFollowup]:
        def _get_all():
            with get_db() as db:
                query_str = "SELECT * FROM lead_followups WHERE workspace_id = :workspace_id"
                params = {"workspace_id": tenant_id}

                if filters:
                    if "lead_id" in filters:
                        query_str += " AND lead_id = :lead_id"
                        params["lead_id"] = filters["lead_id"]

                query_str += " ORDER BY followup_date DESC, created_at DESC LIMIT :limit OFFSET :skip"
                params["limit"] = limit
                params["skip"] = skip

                res = db.execute(text(query_str), params).mappings().all()
                return [self._row_to_followup(r) for r in res]
        return await anyio.to_thread.run_sync(_get_all)

    async def create(self, entity: LeadFollowup) -> LeadFollowup:
        def _create():
            with get_db() as db:
                sql = text("""
                    INSERT INTO lead_followups (
                        id, workspace_id, lead_id, followup_date, followup_time, 
                        followup_type, remarks, status, created_by, created_at,
                        next_followup_date, next_followup_remarks
                    ) VALUES (
                        :id, :workspace_id, :lead_id, :followup_date, :followup_time, 
                        :followup_type, :remarks, :status, :created_by, :created_at,
                        :next_followup_date, :next_followup_remarks
                    )
                """)
                db.execute(sql, {
                    "id": entity.id,
                    "workspace_id": entity.workspace_id,
                    "lead_id": entity.lead_id,
                    "followup_date": entity.followup_date,
                    "followup_time": entity.followup_time,
                    "followup_type": entity.followup_type,
                    "remarks": entity.remarks,
                    "status": entity.status,
                    "created_by": entity.created_by,
                    "created_at": entity.created_at,
                    "next_followup_date": entity.next_followup_date,
                    "next_followup_remarks": entity.next_followup_remarks,
                })

                # Also automatically update the parent Lead's updated_at 
                # and notes if the followup has remarks.
                sql_update_lead = text("""
                    UPDATE leads 
                    SET updated_at = :now, notes = :notes
                    WHERE lead_id = :lead_id AND workspace_id = :workspace_id
                """)
                db.execute(sql_update_lead, {
                    "now": datetime.utcnow(),
                    "notes": entity.remarks,
                    "lead_id": entity.lead_id,
                    "workspace_id": entity.workspace_id,
                })

                return entity
        return await anyio.to_thread.run_sync(_create)

    async def update(self, entity_id: str, tenant_id: str, data: dict[str, Any]) -> Optional[LeadFollowup]:
        # Simple update stub
        return None

    async def delete(self, entity_id: str, tenant_id: str) -> bool:
        def _delete():
            with get_db() as db:
                sql = text("""
                    DELETE FROM lead_followups WHERE id = :id AND workspace_id = :workspace_id
                """)
                res = db.execute(sql, {"id": entity_id, "workspace_id": tenant_id})
                return res.rowcount > 0
        return await anyio.to_thread.run_sync(_delete)

    async def count(self, tenant_id: str, filters: Optional[dict[str, Any]] = None) -> int:
        def _count():
            with get_db() as db:
                query_str = "SELECT COUNT(*) FROM lead_followups WHERE workspace_id = :workspace_id"
                params = {"workspace_id": tenant_id}
                if filters and "lead_id" in filters:
                    query_str += " AND lead_id = :lead_id"
                    params["lead_id"] = filters["lead_id"]
                res = db.execute(text(query_str), params).scalar()
                return res or 0
        return await anyio.to_thread.run_sync(_count)

    async def get_due_followups_for_agent(self, tenant_id: str, agent_id: str, target_date: date) -> list[dict[str, Any]]:
        """Fetch all leads with follow-ups scheduled for today assigned to this agent."""
        def _get_due():
            with get_db() as db:
                sql = text("""
                    SELECT f.*, l.full_name as lead_name, l.phone_primary as lead_phone
                    FROM lead_followups f
                    JOIN leads l ON f.lead_id = l.lead_id AND f.workspace_id = l.workspace_id
                    WHERE f.workspace_id = :workspace_id 
                      AND f.next_followup_date = :target_date
                      AND l.assigned_agent_id = :agent_id
                      AND l.deleted_at IS NULL
                """)
                res = db.execute(sql, {
                    "workspace_id": tenant_id,
                    "agent_id": agent_id,
                    "target_date": target_date
                }).mappings().all()
                return [dict(r) for r in res]
        return await anyio.to_thread.run_sync(_get_due)
