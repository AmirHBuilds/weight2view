from tests.conftest import login_client, make_admin


def test_login_succeeds_with_valid_credentials(client, db):
    make_admin(db, email="owner@weight2view.io", password="correcthorse123")
    res = client.post(
        "/admin/auth/login", json={"email": "owner@weight2view.io", "password": "correcthorse123"}
    )
    assert res.status_code == 200
    assert res.json()["email"] == "owner@weight2view.io"
    assert "w2v_admin_session" in res.cookies


def test_login_fails_with_wrong_password(client, db):
    make_admin(db, email="owner@weight2view.io", password="correcthorse123")
    res = client.post(
        "/admin/auth/login", json={"email": "owner@weight2view.io", "password": "wrong"}
    )
    assert res.status_code == 401


def test_login_fails_with_unknown_email(client, db):
    res = client.post(
        "/admin/auth/login", json={"email": "nobody@weight2view.io", "password": "whatever123"}
    )
    assert res.status_code == 401


def test_inactive_admin_cannot_log_in(client, db):
    make_admin(db, email="gone@weight2view.io", password="correcthorse123", active=False)
    res = client.post(
        "/admin/auth/login", json={"email": "gone@weight2view.io", "password": "correcthorse123"}
    )
    assert res.status_code == 401


def test_password_is_never_returned(client, db):
    make_admin(db, email="owner@weight2view.io", password="correcthorse123")
    res = client.post(
        "/admin/auth/login", json={"email": "owner@weight2view.io", "password": "correcthorse123"}
    )
    body = res.json()
    assert "password" not in body
    assert "password_hash" not in body


def test_logout_invalidates_session(client, db):
    admin = make_admin(db)
    login_client(client, db, admin)
    assert client.get("/admin/auth/me").status_code == 200

    logout_res = client.post("/admin/auth/logout")
    assert logout_res.status_code == 204

    assert client.get("/admin/auth/me").status_code == 401


def test_unauthenticated_request_is_rejected(client):
    for path in ["/admin/items", "/admin/references", "/admin/requests", "/admin/admins"]:
        res = client.get(path)
        assert res.status_code == 401, f"{path} should require authentication"


def test_authenticated_admin_can_access_admin_routes(client, db):
    admin = make_admin(db, role="admin")
    login_client(client, db, admin)
    assert client.get("/admin/items").status_code == 200
    assert client.get("/admin/references").status_code == 200
    assert client.get("/admin/requests").status_code == 200


def test_regular_admin_cannot_access_super_admin_routes(client, db):
    admin = make_admin(db, email="regular@weight2view.io", role="admin")
    login_client(client, db, admin)
    res = client.get("/admin/admins")
    assert res.status_code == 403


def test_super_admin_can_access_super_admin_routes(client, db):
    admin = make_admin(db, role="super_admin")
    login_client(client, db, admin)
    res = client.get("/admin/admins")
    assert res.status_code == 200
