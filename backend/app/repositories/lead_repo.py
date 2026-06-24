"""
Lead Repository
================
Concrete MySQL database implementation of lead data access.
Implements the multi-tenant row-level isolation using workspace_id,
soft deletes using deleted_at, and handles lead_notes relationship.
"""

import uuid
from datetime import datetime, timezone
from typing import Any, Optional
import anyio
from sqlalchemy import text

from backend.app.models.lead import Lead
from backend.app.repositories.base import BaseRepository
from backend.app.core.database import get_db


class LeadRepository(BaseRepository[Lead]):
    """
    MySQL database repository for CRM leads.
    Filters all queries by workspace_id to guarantee tenant data isolation.
    """

    def _row_to_lead(self, row: dict[str, Any]) -> Lead:
        """Helper to construct a Lead domain model from a database row."""
        # Convert created_at and updated_at to datetime with UTC timezone
        created_at = row["created_at"]
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        elif created_at and not created_at.tzinfo:
            created_at = created_at.replace(tzinfo=timezone.utc)

        updated_at = row["updated_at"]
        if isinstance(updated_at, str):
            updated_at = datetime.fromisoformat(updated_at)
        elif updated_at and not updated_at.tzinfo:
            updated_at = updated_at.replace(tzinfo=timezone.utc)

        next_f_date = row.get("next_followup_date")
        if next_f_date:
            if hasattr(next_f_date, "strftime"):
                next_f_date = next_f_date.strftime("%Y-%m-%d")
            else:
                next_f_date = str(next_f_date)

        return Lead(
            id=row["lead_id"],
            name=row["full_name"],
            email=row["email"] or "",
            phone=row["phone_primary"],
            company=row["company_name"],
            source=row["lead_source"] or "website",
            status=row["lead_status"] or "new",
            score=row["lead_score"] or 0,
            assigned_to=row["assigned_agent_id"],
            created_by=row.get("created_by") or "Admin",
            tenant_id=row["workspace_id"],
            notes=row.get("latest_note"),
            value=float(row["deal_value_expected"] or 0.0),
            created_at=created_at or datetime.now(timezone.utc),
            updated_at=updated_at or datetime.now(timezone.utc),
            product_interest=row.get("product_interest"),
            tags=row.get("tags"),
            next_followup_date=next_f_date,
        )

    async def get_by_id(self, entity_id: str, tenant_id: str) -> Optional[Lead]:
        """Retrieve a lead by ID with its latest note and next follow up date, filtered by workspace_id."""
        def _get():
            with get_db() as db:
                sql = text("""
                    SELECT l.*, n.note as latest_note, f.next_followup_date
                    FROM leads l
                    LEFT JOIN (
                        SELECT n1.lead_id, n1.note 
                        FROM lead_notes n1
                        JOIN (
                            SELECT lead_id, MAX(created_at) as max_created 
                            FROM lead_notes 
                            GROUP BY lead_id
                        ) n2 ON n1.lead_id = n2.lead_id AND n1.created_at = n2.max_created
                    ) n ON l.lead_id = n.lead_id
                    LEFT JOIN (
                        SELECT f1.lead_id, f1.next_followup_date
                        FROM lead_followups f1
                        JOIN (
                            SELECT lead_id, MAX(created_at) as max_created
                            FROM lead_followups
                            GROUP BY lead_id
                        ) f2 ON f1.lead_id = f2.lead_id AND f1.created_at = f2.max_created
                    ) f ON l.lead_id = f.lead_id
                    WHERE l.lead_id = :lead_id AND l.workspace_id = :workspace_id AND l.deleted_at IS NULL
                """)
                res = db.execute(sql, {"lead_id": entity_id, "workspace_id": tenant_id}).mappings().first()
                if not res:
                    return None
                return self._row_to_lead(res)
        return await anyio.to_thread.run_sync(_get)

    async def get_all(
        self, tenant_id: str, filters: Optional[dict[str, Any]] = None,
        skip: int = 0, limit: int = 20,
    ) -> list[Lead]:
        """Retrieve paginated leads filtered by workspace_id and optional filters."""
        def _get_all():
            with get_db() as db:
                query_str = """
                    SELECT l.*, n.note as latest_note, f.next_followup_date
                    FROM leads l
                    LEFT JOIN (
                        SELECT n1.lead_id, n1.note 
                        FROM lead_notes n1
                        JOIN (
                            SELECT lead_id, MAX(created_at) as max_created 
                            FROM lead_notes 
                            GROUP BY lead_id
                        ) n2 ON n1.lead_id = n2.lead_id AND n1.created_at = n2.max_created
                    ) n ON l.lead_id = n.lead_id
                    LEFT JOIN (
                        SELECT f1.lead_id, f1.next_followup_date
                        FROM lead_followups f1
                        JOIN (
                            SELECT lead_id, MAX(created_at) as max_created
                            FROM lead_followups
                            GROUP BY lead_id
                        ) f2 ON f1.lead_id = f2.lead_id AND f1.created_at = f2.max_created
                    ) f ON l.lead_id = f.lead_id
                    WHERE l.workspace_id = :workspace_id AND l.deleted_at IS NULL
                """
                params = {"workspace_id": tenant_id}
                
                # Apply RBAC security scoping
                if filters and "current_user_id" in filters:
                    from backend.app.core.rbac import get_security_context
                    context = get_security_context(db, filters["current_user_id"], tenant_id, "crm")
                    if context["scope"] == "own":
                        query_str += " AND (l.assigned_agent_id = :current_user_id OR l.created_by = :current_user_id)"
                        params["current_user_id"] = filters["current_user_id"]
                    elif context["scope"] in ("team", "department"):
                        query_str += " AND l.assigned_agent_id IN :allowed_user_ids"
                        params["allowed_user_ids"] = tuple(context["user_ids"]) if context["user_ids"] else (filters["current_user_id"],)

                if filters:
                    if "status" in filters:
                        query_str += " AND l.lead_status = :status"
                        params["status"] = filters["status"]
                    if "source" in filters:
                        query_str += " AND l.lead_source = :source"
                        params["source"] = filters["source"]
                    if "assigned_to" in filters:
                        query_str += " AND l.assigned_agent_id = :assigned_to"
                        params["assigned_to"] = filters["assigned_to"]
                    if "search" in filters and filters["search"]:
                        search_term = filters["search"].strip()[:100]
                        if search_term:
                            query_str += " AND MATCH(l.full_name, l.email, l.phone_primary, l.company_name) AGAINST(:search IN NATURAL LANGUAGE MODE)"
                            params["search"] = search_term
                
                query_str += " ORDER BY l.created_at DESC LIMIT :limit OFFSET :skip"
                params["limit"] = limit
                params["skip"] = skip
                
                res = db.execute(text(query_str), params).mappings().all()
                return [self._row_to_lead(r) for r in res]
        return await anyio.to_thread.run_sync(_get_all)

    async def create(self, entity: Lead) -> Lead:
        """Create a new lead and log its initial creation activity in the database."""
        def _create():
            with get_db() as db:
                # Insert lead record
                sql_lead = text("""
                    INSERT INTO leads (
                        lead_id, workspace_id, assigned_agent_id, created_by, full_name, phone_primary, 
                        email, company_name, lead_source, lead_status, lead_score, 
                        deal_value_expected, created_at, updated_at
                    ) VALUES (
                        :lead_id, :workspace_id, :assigned_agent_id, :created_by, :full_name, :phone_primary, 
                        :email, :company_name, :lead_source, :lead_status, :lead_score, 
                        :deal_value_expected, :created_at, :updated_at
                    )
                """)
                db.execute(sql_lead, {
                    "lead_id": entity.id,
                    "workspace_id": entity.tenant_id,
                    "assigned_agent_id": entity.assigned_to,
                    "created_by": entity.created_by,
                    "full_name": entity.name,
                    "phone_primary": entity.phone,
                    "email": entity.email,
                    "company_name": entity.company,
                    "lead_source": entity.source,
                    "lead_status": entity.status,
                    "lead_score": entity.score,
                    "deal_value_expected": entity.value,
                    "created_at": entity.created_at,
                    "updated_at": entity.updated_at
                })
                
                # Insert lead notes if present
                if entity.notes:
                    sql_note = text("""
                        INSERT INTO lead_notes (id, workspace_id, lead_id, note)
                        VALUES (:id, :workspace_id, :lead_id, :note)
                    """)
                    db.execute(sql_note, {
                        "id": str(uuid.uuid4()),
                        "workspace_id": entity.tenant_id,
                        "lead_id": entity.id,
                        "note": entity.notes
                    })
                
                # Log lead assignment/creation activity
                la_id = str(uuid.uuid4())
                sql_act = text("""
                    INSERT INTO lead_activities (id, workspace_id, lead_id, activity_type, activity_title, activity_description)
                    VALUES (:id, :workspace_id, :lead_id, 'Assigned', 'Lead Created', 'Lead created via API.')
                """)
                db.execute(sql_act, {
                    "id": la_id,
                    "workspace_id": entity.tenant_id,
                    "lead_id": entity.id
                })
                
                return entity
        return await anyio.to_thread.run_sync(_create)

    async def update(self, entity_id: str, tenant_id: str, data: dict[str, Any], changed_by: Optional[str] = None) -> Optional[Lead]:
        """Update an existing lead's fields, log changes, and record notes."""
        def _update():
            with get_db() as db:
                # Check lead existence and fetch old values for audit logging
                check_sql = text("""
                    SELECT lead_id, full_name, email, phone_primary, company_name, 
                           lead_source, lead_status, lead_score, assigned_agent_id, deal_value_expected 
                    FROM leads 
                    WHERE lead_id = :lead_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                old_row = db.execute(check_sql, {"lead_id": entity_id, "workspace_id": tenant_id}).mappings().first()
                if not old_row:
                    return None
                
                field_mappings = {
                    "name": "full_name",
                    "email": "email",
                    "phone": "phone_primary",
                    "company": "company_name",
                    "source": "lead_source",
                    "status": "lead_status",
                    "score": "lead_score",
                    "assigned_to": "assigned_agent_id",
                    "value": "deal_value_expected"
                }
                
                update_parts = []
                params = {"lead_id": entity_id, "workspace_id": tenant_id}
                
                # Formulate set statements and perform change audits
                for k, v in data.items():
                    if k in field_mappings:
                        col_name = field_mappings[k]
                        update_parts.append(f"{col_name} = :{k}")
                        params[k] = v
                        
                        # Simple audit logging if field value changed
                        old_val = str(old_row[col_name]) if old_row[col_name] is not None else ""
                        new_val = str(v) if v is not None else ""
                        if old_val != new_val:
                            audit_id = str(uuid.uuid4())
                            db.execute(text("""
                                INSERT INTO lead_audit_logs (id, workspace_id, lead_id, field_name, old_value, new_value, changed_by)
                                VALUES (:id, :workspace_id, :lead_id, :field, :old, :new, :changed_by)
                            """), {
                                "id": audit_id, "workspace_id": tenant_id, "lead_id": entity_id,
                                "field": col_name, "old": old_val, "new": new_val, "changed_by": changed_by
                            })
                
                if update_parts:
                    sql_update = f"UPDATE leads SET {', '.join(update_parts)} WHERE lead_id = :lead_id AND workspace_id = :workspace_id"
                    db.execute(text(sql_update), params)
                
                # Insert a new note entry if notes updated
                if "notes" in data and data["notes"]:
                    sql_note = text("""
                        INSERT INTO lead_notes (id, workspace_id, lead_id, note)
                        VALUES (:id, :workspace_id, :lead_id, :note)
                    """)
                    db.execute(sql_note, {
                        "id": str(uuid.uuid4()),
                        "workspace_id": tenant_id,
                        "lead_id": entity_id,
                        "note": data["notes"]
                    })
                
                # Retrieve and return updated lead
                sql_select = text("""
                    SELECT l.*, n.note as latest_note 
                    FROM leads l
                    LEFT JOIN (
                        SELECT n1.lead_id, n1.note 
                        FROM lead_notes n1
                        JOIN (
                            SELECT lead_id, MAX(created_at) as max_created 
                            FROM lead_notes 
                            GROUP BY lead_id
                        ) n2 ON n1.lead_id = n2.lead_id AND n1.created_at = n2.max_created
                    ) n ON l.lead_id = n.lead_id
                    WHERE l.lead_id = :lead_id AND l.workspace_id = :workspace_id
                """)
                res = db.execute(sql_select, {"lead_id": entity_id, "workspace_id": tenant_id}).mappings().first()
                if res:
                    return self._row_to_lead(res)
                return None
        return await anyio.to_thread.run_sync(_update)

    async def delete(self, entity_id: str, tenant_id: str) -> bool:
        """Soft delete a lead by setting deleted_at to current timestamp."""
        def _delete():
            with get_db() as db:
                sql = text("""
                    UPDATE leads 
                    SET deleted_at = CURRENT_TIMESTAMP 
                    WHERE lead_id = :lead_id AND workspace_id = :workspace_id AND deleted_at IS NULL
                """)
                res = db.execute(sql, {"lead_id": entity_id, "workspace_id": tenant_id})
                return res.rowcount > 0
        return await anyio.to_thread.run_sync(_delete)

    async def count(self, tenant_id: str, filters: Optional[dict[str, Any]] = None) -> int:
        """Count active leads matching workspace_id and optional filters."""
        def _count():
            with get_db() as db:
                query_str = """
                    SELECT COUNT(*) FROM leads l 
                    WHERE l.workspace_id = :workspace_id AND l.deleted_at IS NULL
                """
                params = {"workspace_id": tenant_id}
                
                # Apply RBAC security scoping
                if filters and "current_user_id" in filters:
                    from backend.app.core.rbac import get_security_context
                    context = get_security_context(db, filters["current_user_id"], tenant_id, "crm")
                    if context["scope"] == "own":
                        query_str += " AND (l.assigned_agent_id = :current_user_id OR l.created_by = :current_user_id)"
                        params["current_user_id"] = filters["current_user_id"]
                    elif context["scope"] in ("team", "department"):
                        query_str += " AND l.assigned_agent_id IN :allowed_user_ids"
                        params["allowed_user_ids"] = tuple(context["user_ids"]) if context["user_ids"] else (filters["current_user_id"],)

                if filters:
                    if "status" in filters:
                        query_str += " AND l.lead_status = :status"
                        params["status"] = filters["status"]
                    if "source" in filters:
                        query_str += " AND l.lead_source = :source"
                        params["source"] = filters["source"]
                    if "assigned_to" in filters:
                        query_str += " AND l.assigned_agent_id = :assigned_to"
                        params["assigned_to"] = filters["assigned_to"]
                
                return db.execute(text(query_str), params).scalar()
        return await anyio.to_thread.run_sync(_count)

    async def get_audit_logs(self, lead_id: str, tenant_id: str) -> list[dict]:
        """Fetch audit logs for a lead, sorted by changed_at DESC."""
        def _get():
            with get_db() as db:
                sql = text("""
                    SELECT id, field_name, old_value, new_value, changed_by, changed_at 
                    FROM lead_audit_logs 
                    WHERE lead_id = :lead_id AND workspace_id = :workspace_id 
                    ORDER BY changed_at DESC
                """)
                res = db.execute(sql, {"lead_id": lead_id, "workspace_id": tenant_id}).mappings().all()
                return [dict(r) for r in res]
        return await anyio.to_thread.run_sync(_get)


# Global singleton instance
_lead_repo = LeadRepository()


def get_lead_repository() -> LeadRepository:
    """Dependency injector for LeadRepository."""
    return _lead_repo
