"""
Shared fixtures for the auth/authorization/CRUD integration tests. These
run against a real, dedicated Postgres database (`weight2view_test`) -
migrated once per test session - rather than mocks, since the behavior
under test (session cookies, DB constraints, FK safety checks) is exactly
the kind of thing that's easy to get subtly wrong with a fake DB layer.

Setup once (see backend README):
    createdb weight2view_test  (or: psql -c "CREATE DATABASE weight2view_test")
    DATABASE_URL=...weight2view_test alembic upgrade head
"""
import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+psycopg2://weight2view:weight2view@localhost:5432/weight2view_test",
)

# Point the app at the test DB before anything imports app.config/app.database.
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

# Explicitly blank out the bootstrap admin credentials for the test
# process. Without this, pydantic-settings would still pick up
# ADMIN_EMAIL/ADMIN_PASSWORD from backend/.env (used for local dev), and
# the app's startup event would create that account in the *test*
# database too - colliding with fixtures that create their own admins
# with predictable emails. Setting env vars (even to "") takes priority
# over the .env file, and an empty string reads as "not configured" by
# bootstrap_super_admin's `if not settings.admin_email` check.
os.environ["ADMIN_EMAIL"] = ""
os.environ["ADMIN_PASSWORD"] = ""

from app.config import get_settings  # noqa: E402
from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models.admin_user import AdminUser  # noqa: E402
from app.services.auth import create_session, hash_password  # noqa: E402

get_settings.cache_clear()

engine = create_engine(TEST_DATABASE_URL)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def _prepare_schema():
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture(autouse=True)
def _clean_tables():
    """Truncate everything between tests so each test starts from a blank slate."""
    yield
    with engine.begin() as conn:
        conn.execute(
            text(
                "TRUNCATE TABLE admin_sessions, admin_users, item_requests, "
                "item_measurements, item_aliases, items, reference_objects RESTART IDENTITY CASCADE"
            )
        )


@pytest.fixture
def db():
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    def _override_get_db():
        yield db

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def make_admin(db, email="admin@weight2view.io", password="password123", role="super_admin", active=True) -> AdminUser:
    admin = AdminUser(email=email, password_hash=hash_password(password), role=role, is_active=active)
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


def login_client(client, db, admin: AdminUser) -> None:
    """Logs `client`'s cookie jar in as `admin` without needing the real password (tests already have the AdminUser)."""
    session = create_session(db, admin)
    client.cookies.set("w2v_admin_session", session.token)
