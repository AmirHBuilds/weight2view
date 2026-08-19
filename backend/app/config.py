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

    # Admin
    # TODO(auth): Replace this dev-only flag with real authentication/authorization
    # (e.g. session-based admin login, JWT, or an SSO integration) before any
    # non-local deployment. See app/api/admin/__init__.py for the seam where
    # a real `require_admin` dependency should be plugged in.
    admin_dev_mode: bool = True

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
