from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import calculate, items, references, requests as requests_api
from app.api.admin import items as admin_items
from app.api.admin import references as admin_references
from app.api.admin import requests as admin_requests
from app.config import get_settings

settings = get_settings()

app = FastAPI(title=settings.app_name)

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

# Admin API (see app/api/admin/__init__.py for the auth TODO)
app.include_router(admin_items.router)
app.include_router(admin_references.router)
app.include_router(admin_requests.router)


@app.get("/health")
def health():
    return {"status": "ok", "environment": settings.environment}
