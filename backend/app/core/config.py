"""
Application Configuration Module
=================================
Loads all settings from the root .env file using Pydantic BaseSettings.
No hardcoded values — everything is driven by environment variables.
"""

from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


# Resolve the root .env file (two levels up from this file: core/ -> app/ -> backend/ -> root)
_ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
_ENV_FILE = _ROOT_DIR / ".env"


class Settings(BaseSettings):
    """
    Central configuration loaded from the root .env file.
    All values have sensible defaults but should be overridden via .env.
    """

    # ── Application ──────────────────────────────────────────────
    APP_NAME: str = "AIO CRM Platform"
    APP_ENV: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    APP_DEBUG: bool = True

    # ── Frontend ─────────────────────────────────────────────────
    FRONTEND_HOST: str = "localhost"
    FRONTEND_PORT: int = 5173
    CORS_ORIGINS: str = ""  # Comma-separated list of allowed origins in production

    # ── JWT Authentication ───────────────────────────────────────
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_EXPIRE_DAYS: int = 7


    # ── Database ──────────────────────────────────────────────────
    DB_HOST: str = "127.0.0.1"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASS: str = ""
    DB_NAME: str = "enterprise_crm"
    DATABASE_URL: str | None = None

    # ── Logging ──────────────────────────────────────────────────
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"

    # ── Meta OAuth Integration ───────────────────────────────────
    META_APP_ID: str = ""
    META_APP_SECRET: str = ""
    META_REDIRECT_URI: str = "http://localhost:8000/api/auth/meta/callback"
    META_GRAPH_API_VERSION: str = "v24.0"
    META_API_VERSION: str = "v24.0"
    META_WEBHOOK_VERIFY_TOKEN: str = "AIO_CRM_META_WEBHOOK_SECRET"

    # ── Shopify OAuth Integration ────────────────────────────────
    SHOPIFY_CLIENT_ID: str = ""
    SHOPIFY_CLIENT_SECRET: str = ""
    SHOPIFY_REDIRECT_URI: str = "http://localhost:8000/api/integrations/shopify/callback"
    SHOPIFY_SCOPES: str = "read_products,write_products,read_customers,write_customers,read_orders,write_orders,read_inventory"

    # ── Computed Properties ──────────────────────────────────────
    @property
    def db_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        # Ensure password is clean or format properly
        pwd_part = f":{self.DB_PASS}" if self.DB_PASS else ""
        return f"mysql+pymysql://{self.DB_USER}{pwd_part}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"

    @property
    def is_development(self) -> bool:
        return self.APP_ENV == "development"

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def frontend_url(self) -> str:
        return f"http://{self.FRONTEND_HOST}:{self.FRONTEND_PORT}"

    @property
    def backend_url(self) -> str:
        return f"http://{self.APP_HOST}:{self.APP_PORT}"

    @property
    def cors_origins(self) -> list[str]:
        """Allowed CORS origins — includes frontend URL and common dev origins."""
        origins = []
        if self.CORS_ORIGINS:
            origins.extend([org.strip() for org in self.CORS_ORIGINS.split(",") if org.strip()])
        
        origins.extend([
            self.frontend_url,
            f"http://localhost:{self.FRONTEND_PORT}",
            f"http://127.0.0.1:{self.FRONTEND_PORT}",
        ])
        
        if "localhost" not in self.FRONTEND_HOST and "127.0.0.1" not in self.FRONTEND_HOST:
            origins.extend([
                f"https://{self.FRONTEND_HOST}",
                f"http://{self.FRONTEND_HOST}",
                f"https://{self.FRONTEND_HOST}:{self.FRONTEND_PORT}",
                f"http://{self.FRONTEND_HOST}:{self.FRONTEND_PORT}",
            ])
            
        if self.is_development:
            origins.append("http://localhost:3000")
            
        return list(set(origins))

    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    """
    Cached singleton — returns the same Settings instance across the app.
    Call get_settings() anywhere to access configuration.
    """
    return Settings()
