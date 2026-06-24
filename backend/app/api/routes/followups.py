"""
Lead Followup Endpoints
=======================
API routes for creating, retrieving, and listing lead followups.
"""

from datetime import datetime
from fastapi import APIRouter, Depends, Request, Query
from typing import Optional

from backend.app.schemas.followup import FollowupCreate, FollowupResponse
from backend.app.repositories.followup_repo import LeadFollowupRepository
from backend.app.models.followup import LeadFollowup
from backend.app.api.dependencies.auth import get_current_user
from backend.app.utils.response import success_response

router = APIRouter(dependencies=[Depends(get_current_user)])
_repo = LeadFollowupRepository()


@router.get("/due-today")
async def get_due_followups(request: Request):
    """
    Get all due followups scheduled for today for the logged-in agent.
    """
    tenant_id = request.state.tenant.id
    user = getattr(request.state, "user", None)
    if not user:
        return success_response(data=[], message="No logged-in user context")
        
    agent_id = user.get("id")
    today_date = datetime.utcnow().date()
    
    due_items = await _repo.get_due_followups_for_agent(
        tenant_id=tenant_id,
        agent_id=agent_id,
        target_date=today_date
    )
    return success_response(data=due_items, message="Due followups retrieved successfully")


@router.get("/leads/{lead_id}/followups")
async def list_lead_followups(
    request: Request,
    lead_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(100, ge=1, le=200)
):
    """
    Get history of all follow-ups logged for a specific lead.
    """
    tenant_id = request.state.tenant.id
    filters = {"lead_id": lead_id}
    skip = (page - 1) * per_page
    
    items = await _repo.get_all(tenant_id, filters=filters, skip=skip, limit=per_page)
    # Reverse sort by date to get chronological order (oldest first or newest first)
    # For UI logs, sorting newest first is great, but we can also sort oldest first.
    # Let's return them sorted by created_at ascending so it reads like a history book.
    items_sorted = sorted(items, key=lambda x: x.created_at)
    
    return success_response(
        data=[item.to_dict() for item in items_sorted],
        message="Followup history retrieved successfully"
    )


@router.post("/leads/{lead_id}/followups")
async def create_lead_followup(
    request: Request,
    lead_id: str,
    payload: FollowupCreate
):
    """
    Log a new followup for a lead and optionally schedule the next one.
    """
    tenant_id = request.state.tenant.id
    user = getattr(request.state, "user", None)
    created_by_email = user.get("email") if user else "System"
    
    new_followup = LeadFollowup(
        workspace_id=tenant_id,
        lead_id=lead_id,
        followup_date=payload.followup_date,
        followup_time=payload.followup_time,
        followup_type=payload.followup_type,
        remarks=payload.remarks,
        status="Completed",
        created_by=created_by_email,
        next_followup_date=payload.next_followup_date,
        next_followup_remarks=payload.next_followup_remarks
    )
    
    created = await _repo.create(new_followup)
    
    # Also update the parent lead's followup_at field
    if payload.next_followup_date:
        from backend.app.core.database import get_db
        from sqlalchemy import text
        with get_db() as db:
            db.execute(
                text("""
                    UPDATE leads 
                    SET followup_at = :next_date
                    WHERE lead_id = :lead_id AND workspace_id = :workspace_id
                """),
                {
                    "next_date": payload.next_followup_date,
                    "lead_id": lead_id,
                    "workspace_id": tenant_id
                }
            )
            
    return success_response(data=created.to_dict(), message="Followup logged successfully", status_code=201)
