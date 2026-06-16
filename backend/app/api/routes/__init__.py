"""
API Routes Registration
=======================
Aggregates all route modules (auth, health, users, leads, contacts, meta)
into a single APIRouter instance, ready to be included in the main FastAPI application.
"""

from fastapi import APIRouter

from backend.app.api.routes.auth import router as auth_router
from backend.app.api.routes.health import router as health_router
from backend.app.api.routes.users import router as users_router
from backend.app.api.routes.leads import router as leads_router
from backend.app.api.routes.contacts import router as contacts_router
from backend.app.api.routes.clients import router as clients_router
from backend.app.api.routes.meta_oauth import router as meta_router
from backend.app.api.routes.shopify import router as shopify_router
from backend.app.api.routes.projects import router as projects_router
from backend.app.api.routes.products import router as products_router
from backend.app.api.routes.invoices import router as invoices_router
from backend.app.api.routes.quotes import router as quotes_router
from backend.app.api.routes.payments import router as payments_router
from backend.app.api.routes.ledger import router as ledger_router
from backend.app.api.routes.expenses import router as expenses_router
from backend.app.api.routes.gst import router as gst_router
from backend.app.api.routes.employees import router as employees_router
from backend.app.api.routes.attendance import router as attendance_router
from backend.app.api.routes.leaves import router as leaves_router
from backend.app.api.routes.payroll import router as payroll_router
from backend.app.api.routes.tasks import router as tasks_router
from backend.app.api.routes.reminders import router as reminders_router
from backend.app.api.routes.roles import router as roles_router
from backend.app.api.routes.audit_logs import router as audit_logs_router
from backend.app.api.routes.super_admin import router as super_admin_router
from backend.app.api.routes.search import router as search_router
from backend.app.api.routes.workspace_admin import router as workspace_admin_router
from backend.app.api.routes.whatsapp_integration import router as whatsapp_integration_router
from backend.app.api.webhooks.whatsapp import router as whatsapp_webhook_router
from backend.app.api.routes.documents import router as documents_router
from backend.app.api.routes.payroll_adjustments import router as payroll_adjustments_router

api_router = APIRouter()

# Register individual sub-routers with prefixes and tags for Swagger docs
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(health_router, tags=["System Health"])
api_router.include_router(users_router, prefix="/users", tags=["Users"])
api_router.include_router(leads_router, prefix="/leads", tags=["Leads"])
api_router.include_router(contacts_router, prefix="/contacts", tags=["Contacts"])
api_router.include_router(clients_router, prefix="/clients", tags=["Clients"])
api_router.include_router(meta_router, prefix="/meta", tags=["Meta Integration"])
api_router.include_router(shopify_router, prefix="/integrations/shopify", tags=["Shopify Integration"])
api_router.include_router(whatsapp_integration_router, prefix="/integrations/whatsapp", tags=["WhatsApp Integration"])
api_router.include_router(whatsapp_webhook_router, prefix="/webhooks", tags=["WhatsApp Webhook"])
api_router.include_router(projects_router, prefix="/projects", tags=["Projects"])
api_router.include_router(products_router, prefix="/products", tags=["Products"])
api_router.include_router(invoices_router, prefix="/invoices", tags=["Invoices"])
api_router.include_router(quotes_router, prefix="/quotes", tags=["Quotes"])
api_router.include_router(payments_router, prefix="/payments", tags=["Payments"])
api_router.include_router(ledger_router, prefix="/ledger", tags=["General Ledger"])
api_router.include_router(expenses_router, prefix="/expenses", tags=["Expenses"])
api_router.include_router(gst_router, prefix="/gst", tags=["GST Reports"])
api_router.include_router(employees_router, prefix="/employees", tags=["HRMS Employees"])
api_router.include_router(attendance_router, prefix="/attendance", tags=["HRMS Attendance"])
api_router.include_router(leaves_router, prefix="/leaves", tags=["HRMS Leaves"])
api_router.include_router(payroll_router, prefix="/payroll", tags=["HRMS Payroll"])
api_router.include_router(payroll_adjustments_router, prefix="/payroll/adjustments", tags=["HRMS Payroll Adjustments"])
api_router.include_router(documents_router, prefix="/documents", tags=["HRMS Documents"])
api_router.include_router(tasks_router, prefix="/tasks", tags=["CRM Tasks"])
api_router.include_router(reminders_router, prefix="/reminders", tags=["CRM Reminders"])
api_router.include_router(roles_router, prefix="/roles", tags=["CRM Roles"])
api_router.include_router(audit_logs_router, prefix="/audit-logs", tags=["CRM Audit Logs"])
api_router.include_router(super_admin_router, prefix="/super-admin", tags=["SaaS Super Admin"])
api_router.include_router(super_admin_router, prefix="/superadmin", tags=["SaaS Super Admin"])
api_router.include_router(search_router, prefix="/search", tags=["Global Search"])
api_router.include_router(workspace_admin_router, prefix="/admin", tags=["SaaS Workspace Admin"])

