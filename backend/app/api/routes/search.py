from fastapi import APIRouter, Depends, Query, Request, HTTPException
from sqlalchemy import text
from backend.app.core.database import get_db
from backend.app.api.dependencies.auth import get_current_user

router = APIRouter(dependencies=[Depends(get_current_user)])

@router.get("/global")
async def global_search(
    request: Request,
    q: str = Query(..., min_length=1, max_length=100),
    limit: int = Query(10, ge=1, le=50),
):
    """
    Globally search across leads, contacts, clients, products, and projects
    using optimized MySQL FULLTEXT index searches.
    """
    tenant_id = request.state.tenant.id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Missing tenant context")
    
    q_clean = q.strip()
    if not q_clean:
        return {"data": []}

    results = []

    query_leads = text("""
        SELECT lead_id, full_name, email, company_name 
        FROM leads 
        WHERE workspace_id = :workspace_id AND deleted_at IS NULL
          AND MATCH(full_name, email, phone_primary, company_name) AGAINST(:q IN NATURAL LANGUAGE MODE)
        LIMIT :limit
    """)

    query_contacts = text("""
        SELECT contact_id, name, email, company 
        FROM contacts 
        WHERE workspace_id = :workspace_id
          AND MATCH(name, email, company, phone) AGAINST(:q IN NATURAL LANGUAGE MODE)
        LIMIT :limit
    """)

    query_clients = text("""
        SELECT client_id, name, email, industry 
        FROM clients 
        WHERE workspace_id = :workspace_id
          AND MATCH(name, email, phone, industry, owner_name) AGAINST(:q IN NATURAL LANGUAGE MODE)
        LIMIT :limit
    """)

    query_products = text("""
        SELECT product_id, name, sku, category 
        FROM ecommerce_products 
        WHERE workspace_id = :workspace_id AND deleted_at IS NULL
          AND MATCH(name, sku, category, brand, description) AGAINST(:q IN NATURAL LANGUAGE MODE)
        LIMIT :limit
    """)

    query_projects = text("""
        SELECT project_id, name, status, stage 
        FROM projects 
        WHERE workspace_id = :workspace_id AND deleted_at IS NULL
          AND MATCH(name, description) AGAINST(:q IN NATURAL LANGUAGE MODE)
        LIMIT :limit
    """)

    with get_db() as db:
        # 1. Leads
        res_leads = db.execute(query_leads, {"workspace_id": tenant_id, "q": q_clean, "limit": limit}).mappings().all()
        for r in res_leads:
            results.append({
                "type": "lead",
                "id": r["lead_id"],
                "title": r["full_name"],
                "subtitle": f"{r['company_name']} ({r['email']})" if r["company_name"] else (r["email"] or "")
            })

        # 2. Contacts
        res_contacts = db.execute(query_contacts, {"workspace_id": tenant_id, "q": q_clean, "limit": limit}).mappings().all()
        for r in res_contacts:
            results.append({
                "type": "contact",
                "id": r["contact_id"],
                "title": r["name"],
                "subtitle": f"{r['company']} ({r['email']})" if r["company"] else (r["email"] or "")
            })

        # 3. Clients
        res_clients = db.execute(query_clients, {"workspace_id": tenant_id, "q": q_clean, "limit": limit}).mappings().all()
        for r in res_clients:
            results.append({
                "type": "client",
                "id": r["client_id"],
                "title": r["name"],
                "subtitle": f"{r['industry']} ({r['email']})" if r["industry"] else (r["email"] or "")
            })

        # 4. Products
        res_products = db.execute(query_products, {"workspace_id": tenant_id, "q": q_clean, "limit": limit}).mappings().all()
        for r in res_products:
            results.append({
                "type": "product",
                "id": r["product_id"],
                "title": r["name"],
                "subtitle": f"SKU: {r['sku']} | Category: {r['category']}"
            })

        # 5. Projects
        res_projects = db.execute(query_projects, {"workspace_id": tenant_id, "q": q_clean, "limit": limit}).mappings().all()
        for r in res_projects:
            results.append({
                "type": "project",
                "id": r["project_id"],
                "title": r["name"],
                "subtitle": f"Status: {r['status']} | Stage: {r['stage']}"
            })

    return {"data": results}
