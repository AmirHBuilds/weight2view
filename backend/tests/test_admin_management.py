from tests.conftest import login_client, make_admin


def test_super_admin_can_create_admin(client, db):
    owner = make_admin(db, email="owner@weight2view.io", role="super_admin")
    login_client(client, db, owner)

    res = client.post(
        "/admin/admins",
        json={"email": "new@weight2view.io", "password": "newpassword123", "role": "admin"},
    )
    assert res.status_code == 201
    assert res.json()["role"] == "admin"


def test_regular_admin_cannot_create_admin(client, db):
    regular = make_admin(db, email="regular@weight2view.io", role="admin")
    login_client(client, db, regular)

    res = client.post(
        "/admin/admins",
        json={"email": "new@weight2view.io", "password": "newpassword123", "role": "admin"},
    )
    assert res.status_code == 403


def test_super_admin_can_deactivate_another_admin(client, db):
    owner = make_admin(db, email="owner@weight2view.io", role="super_admin")
    other = make_admin(db, email="other@weight2view.io", role="admin")
    login_client(client, db, owner)

    res = client.patch(f"/admin/admins/{other.id}", json={"is_active": False})
    assert res.status_code == 200
    assert res.json()["is_active"] is False


def test_last_active_super_admin_cannot_be_deactivated(client, db):
    only_owner = make_admin(db, email="owner@weight2view.io", role="super_admin")
    login_client(client, db, only_owner)

    # Someone else (also a super admin, but logged in as themselves) tries
    # to deactivate the only other super admin - here there's only one, so
    # deactivating it (even by another party) must be blocked.
    res = client.patch(f"/admin/admins/{only_owner.id}", json={"is_active": False})
    assert res.status_code == 400


def test_cannot_deactivate_own_account(client, db):
    owner = make_admin(db, email="a@weight2view.io", role="super_admin")
    make_admin(db, email="b@weight2view.io", role="super_admin")  # a second super admin exists
    login_client(client, db, owner)

    res = client.patch(f"/admin/admins/{owner.id}", json={"is_active": False})
    assert res.status_code == 400


def test_last_super_admin_cannot_be_demoted(client, db):
    owner = make_admin(db, email="owner@weight2view.io", role="super_admin")
    second_super = make_admin(db, email="second@weight2view.io", role="super_admin")
    login_client(client, db, owner)

    # Demoting the SECOND super admin is fine (owner remains).
    res = client.patch(f"/admin/admins/{second_super.id}", json={"role": "admin"})
    assert res.status_code == 200

    # Now only `owner` is left as super admin - demoting them must be blocked.
    res2 = client.patch(f"/admin/admins/{owner.id}", json={"role": "admin"})
    assert res2.status_code == 400


def test_reset_password_changes_login(client, db):
    from app.services.auth import verify_password

    owner = make_admin(db, email="owner@weight2view.io", role="super_admin")
    target = make_admin(db, email="target@weight2view.io", password="oldpassword123", role="admin")
    login_client(client, db, owner)

    res = client.post(f"/admin/admins/{target.id}/reset-password", json={"new_password": "newpassword456"})
    assert res.status_code == 200

    db.refresh(target)
    assert verify_password("newpassword456", target.password_hash)
    assert not verify_password("oldpassword123", target.password_hash)
