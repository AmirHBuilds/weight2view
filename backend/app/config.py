"""
Application configuration.

All environment-driven settings live here. Nothing else in the app should
read os.environ directly - go through `settings`.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    database_url: str = "postgresql+psycopg2://weight2view:weight2view@localhost:5432/weight2view"

    # App
    app_name: str = "Weight2View API"
    environment: str = "development"  # development | production
    cors_origins: str = "http://localhost:5173"

    # Admin auth
    # Bootstrap Super Admin, created idempotently on startup if it doesn't
    # already exist (matched by email). Never committed to source control -
    # set via environment/.env only. If either is unset, bootstrap is
    # skipped (with a startup log message) rather than guessing a password.
    admin_email: str | None = None
    admin_password: str | None = None

    # Session cookie
    session_cookie_name: str = "w2v_admin_session"
    session_lifetime_hours: int = 24 * 7
    # Cookies require Secure when SameSite=None (cross-origin fetch with
    # credentials, e.g. the frontend on :5173 calling the backend on :8000
    # directly rather than through the Vite dev proxy - see
    # frontend/vite.config.ts). Force this on in production regardless of
    # what's in .env.
    session_cookie_secure: bool = False

    @property
    def effective_session_cookie_secure(self) -> bool:
        return True if self.environment == "production" else self.session_cookie_secure

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
