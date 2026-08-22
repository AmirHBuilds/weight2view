import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth as auth_api
from app.api import calculate, items, references, requests as requests_api
from app.api.admin import admins as admin_admins
from app.api.admin import items as admin_items
from app.api.admin import references as admin_references
from app.api.admin import requests as admin_requests
from app.config import get_settings
from app.database import SessionLocal
from app.services.auth import bootstrap_super_admin

logger = logging.getLogger("weight2view")

settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Never creates a fallback/default account - see
    # app/services/auth.py:bootstrap_super_admin for the exact rules
    # (no credentials -> skip; only one of the two set -> skip; an existing
    # super admin under a different email -> skip, never a second one).
    # Passwords are never logged, in any branch below.
    db = SessionLocal()
    try:
        result = bootstrap_super_admin(db)
        if result.status == "created":
            logger.info("Bootstrap super admin created: %s", result.admin.email)
        elif result.status == "existing":
            logger.info("Bootstrap super admin already exists: %s", result.admin.email)
        elif result.status == "skipped_already_exists":
            logger.warning(
                "ADMIN_EMAIL does not match any existing account, but a super admin already "
                "exists under a different email - skipping bootstrap to avoid creating a second "
                "privileged account. Manage admins via the Admin Panel instead."
            )
        elif result.status == "skipped_partial_credentials":
            logger.warning(
                "Only one of ADMIN_EMAIL / ADMIN_PASSWORD is set - both are required to "
                "bootstrap a super admin. No account was created."
            )
        else:  # skipped_no_credentials
            logger.warning(
                "ADMIN_EMAIL / ADMIN_PASSWORD not set - no bootstrap super admin was created. "
                "There is no default account. Set both in the environment to create one, or "
                "create an admin manually."
            )
    finally:
        db.close()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Public API
app.include_router(items.router)
app.include_router(calculate.router)
app.include_router(references.router)
app.include_router(requests_api.router)

# Admin API - real session-based auth, see app/api/admin/__init__.py
app.include_router(auth_api.router)
app.include_router(admin_admins.router)
app.include_router(admin_items.router)
app.include_router(admin_references.router)
app.include_router(admin_requests.router)


@app.get("/health")
def health():
    return {"status": "ok", "environment": settings.environment}
