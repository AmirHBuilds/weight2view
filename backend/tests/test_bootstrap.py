"""
Tests for the Super Admin bootstrap credential handling - specifically
that there are no default/fallback credentials anywhere, that bootstrap
only ever fires on a database with zero super admins, and that it never
touches an existing account's password.

Each test explicitly sets ADMIN_EMAIL/ADMIN_PASSWORD via monkeypatch +
get_settings.cache_clear() around itself, and clears the cache again
afterward so it never leaks into other tests (get_settings is
process-wide lru_cache'd).
"""
import pytest

from app.config import get_settings
from app.models.admin_user import AdminUser
from app.services.auth import bootstrap_super_admin, hash_password, verify_password


@pytest.fixture
def configured_credentials(monkeypatch):
    """
    Sets ADMIN_EMAIL/ADMIN_PASSWORD for the duration of one test, then
    restores them to conftest's baseline.

    Uses setenv("", ...) rather than delenv for the "unset" case
    deliberately: pydantic-settings reads BOTH real environment variables
    and the local .env file, with environment variables taking priority.
    Fully deleting the env var would let it fall through to whatever
    backend/.env has on disk (real dev credentials, in this repo) instead
    of the empty string conftest.py already established as this test
    process's baseline - an empty string keeps winning over the .env file
    and still reads as falsy/"not configured" wherever the code checks it.
    """

    def _set(email: str | None, password: str | None):
        monkeypatch.setenv("ADMIN_EMAIL", email or "")
        monkeypatch.setenv("ADMIN_PASSWORD", password or "")
        get_settings.cache_clear()

    yield _set
    get_settings.cache_clear()


def test_case_a_fresh_database_with_valid_credentials_creates_exactly_one(db, configured_credentials):
    configured_credentials("boot@weight2view.io", "bootstrap12345")

    result = bootstrap_super_admin(db)

    assert result.status == "created"
    assert result.admin.email == "boot@weight2view.io"
    assert result.admin.role == "super_admin"
    count = db.query(AdminUser).filter(AdminUser.email == "boot@weight2view.io").count()
    assert count == 1


def test_case_b_restart_does_not_duplicate_or_reset_password(db, configured_credentials):
    configured_credentials("boot@weight2view.io", "bootstrap12345")

    first = bootstrap_super_admin(db)
    original_hash = first.admin.password_hash

    second = bootstrap_super_admin(db)

    assert second.status == "existing"
    assert second.admin.id == first.admin.id
    assert second.admin.password_hash == original_hash
    count = db.query(AdminUser).filter(AdminUser.email == "boot@weight2view.io").count()
    assert count == 1


def test_case_c_missing_credentials_skips_bootstrap_with_no_fallback(db, configured_credentials):
    configured_credentials(None, None)

    result = bootstrap_super_admin(db)

    assert result.status == "skipped_no_credentials"
    assert result.admin is None
    assert db.query(AdminUser).count() == 0


def test_case_d_only_email_set_skips_bootstrap(db, configured_credentials):
    configured_credentials("boot@weight2view.io", None)

    result = bootstrap_super_admin(db)

    assert result.status == "skipped_partial_credentials"
    assert db.query(AdminUser).count() == 0


def test_case_d_only_password_set_skips_bootstrap(db, configured_credentials):
    configured_credentials(None, "bootstrap12345")

    result = bootstrap_super_admin(db)

    assert result.status == "skipped_partial_credentials"
    assert db.query(AdminUser).count() == 0


def test_case_e_existing_different_super_admin_is_not_duplicated_or_modified(db, configured_credentials):
    existing = AdminUser(
        email="existing@weight2view.io",
        password_hash=hash_password("theiroriginalpassword"),
        role="super_admin",
        is_active=True,
    )
    db.add(existing)
    db.commit()
    db.refresh(existing)
    original_hash = existing.password_hash

    configured_credentials("bootstrap@weight2view.io", "bootstrap12345")
    result = bootstrap_super_admin(db)

    assert result.status == "skipped_already_exists"
    # No second account was created.
    assert db.query(AdminUser).count() == 1
    # The existing account is completely untouched.
    db.refresh(existing)
    assert existing.password_hash == original_hash
    assert existing.email == "existing@weight2view.io"


def test_case_f_manually_changed_password_survives_restart(db, configured_credentials):
    configured_credentials("boot@weight2view.io", "originalbootpassword")
    created = bootstrap_super_admin(db)
    admin = created.admin

    # Simulate the admin changing their password via the Admin Panel
    # (POST /admin/admins/{id}/reset-password uses the same hash_password
    # call under the hood - see app/api/admin/admins.py).
    admin.password_hash = hash_password("theirnewpassword")
    db.commit()

    # "Restart" - bootstrap runs again with the same .env as before.
    result = bootstrap_super_admin(db)

    assert result.status == "existing"
    db.refresh(admin)
    assert verify_password("theirnewpassword", admin.password_hash)
    assert not verify_password("originalbootpassword", admin.password_hash)


def test_no_hardcoded_default_credentials_in_settings():
    """
    Guards against a regression where a default/fallback value creeps back
    into Settings - these fields must have no default other than None.
    """
    from app.config import Settings

    assert Settings.model_fields["admin_email"].default is None
    assert Settings.model_fields["admin_password"].default is None
