"""
FastAPI Main Application Entrypoint
====================================
Configures and initializes the FastAPI application, mounts middlewares, 
registers routers, and sets up global exception handling.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError

from backend.app.core.config import get_settings
from backend.app.utils.logger import setup_logging, get_logger
from backend.app.utils.exceptions import AppException
from backend.app.utils.response import error_response
from backend.app.middleware.logging import LoggingMiddleware
from backend.app.middleware.tenant import TenantMiddleware
from backend.app.middleware.auth import JWTAuthMiddleware
from backend.app.api.routes import api_router

# Initialize structured logging
logger = get_logger("main")


def create_app() -> FastAPI:
    """
    Application factory to construct and configure the FastAPI instance.
    """
    settings = get_settings()
    setup_logging()

    # Initialise FastAPI app with Swagger & OpenAPI customisation
    app = FastAPI(
        title=settings.APP_NAME,
        description="Core API Backend for AIO CRM Platform (Multi-Tenant, SaaS Ready)",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # ── Exception Handlers ──────────────────────────────────────────

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        """Handle custom application exceptions and return standard error response."""
        return error_response(
            message=exc.message,
            errors=exc.errors,
            status_code=exc.status_code,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """Handle Pydantic/FastAPI validation errors and format consistently."""
        errors = []
        for error in exc.errors():
            loc = ".".join(str(l) for l in error.get("loc", []))
            errors.append({
                "field": loc,
                "message": error.get("msg"),
                "type": error.get("type"),
            })
        return error_response(
            message="Request validation failed",
            errors=errors,
            status_code=422,
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        """Catch-all handler for unhandled errors to avoid leaking details in prod."""
        logger.exception("Unhandled server exception occurred")
        errors = []
        if settings.APP_DEBUG:
            errors.append({"detail": str(exc)})
        return error_response(
            message="An unexpected system error occurred",
            errors=errors,
            status_code=500,
        )

    # ── Middlewares (Order of execution: bottom to top) ─────────────
    # IMPORTANT: CORS must be added LAST so it runs FIRST in the
    # request/response chain. This ensures CORS headers are always
    # present, even when inner middleware (Auth, Tenant) short-circuits
    # with an error response.

    # 1. Global Request/Response Logging & Performance Metrics
    app.add_middleware(LoggingMiddleware)

    # 2. JWT Auth Check (protects endpoints, extracts user)
    app.add_middleware(JWTAuthMiddleware)

    # 3. Multi-Tenant context extraction & validation
    app.add_middleware(TenantMiddleware)

    # 4. CORS Configuration (added LAST → runs FIRST)
    # In development, allow ALL origins (compatible with credentials
    # by using allow_origin_regex instead of allow_origins=["*"]).
    # This avoids issues with local proxies altering the Origin header.
    cors_kwargs = dict(
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )
    if settings.is_development:
        cors_kwargs["allow_origin_regex"] = r".*"
    else:
        cors_kwargs["allow_origins"] = settings.cors_origins
    app.add_middleware(CORSMiddleware, **cors_kwargs)

    # ── API Routes ──────────────────────────────────────────────────
    from backend.app.api.routes.meta_oauth import meta_integration_router
    app.include_router(meta_integration_router)
    app.include_router(api_router, prefix="/api")

    # Serve static uploaded files
    from fastapi.staticfiles import StaticFiles
    import os
    os.makedirs("uploads", exist_ok=True)
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

    @app.get("/")
    async def root_status():
        return {"status": "success", "message": "AIO CRM Platform API is running successfully!"}

    return app


# Create the runnable app instance
app = create_app()
