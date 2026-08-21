from tests.conftest import login_client, make_admin


def make_reference(client, **overrides):
    payload = {
        "name": "Test Mug",
        "category": "everyday",
        "length_mm": 95,
        "width_mm": 95,
        "height_mm": 110,
        "shape": "mug",
        "familiarity_score": 8,
        "active": True,
    }
    payload.update(overrides)
    res = client.post("/admin/references", json=payload)
    assert res.status_code == 201, res.text
    return res.json()


def test_admin_can_edit_reference(client, db):
    admin = make_admin(db)
    login_client(client, db, admin)
    ref = make_reference(client, name="Editable Mug")

    res = client.patch(
        f"/admin/references/{ref['id']}",
        json={**ref, "familiarity_score": 3},
    )
    assert res.status_code == 200
    assert res.json()["familiarity_score"] == 3


def test_admin_can_deactivate_and_reactivate_reference(client, db):
    admin = make_admin(db)
    login_client(client, db, admin)
    ref = make_reference(client, name="Togglable Mug")

    deactivated = client.post(f"/admin/references/{ref['id']}/deactivate")
    assert deactivated.status_code == 200
    assert deactivated.json()["active"] is False

    reactivated = client.post(f"/admin/references/{ref['id']}/activate")
    assert reactivated.status_code == 200
    assert reactivated.json()["active"] is True


def test_inactive_references_excluded_from_public_endpoint(client, db):
    admin = make_admin(db)
    login_client(client, db, admin)
    ref = make_reference(client, name="Hidden Mug")
    client.post(f"/admin/references/{ref['id']}/deactivate")

    public_res = client.get("/references")
    names = [r["name"] for r in public_res.json()]
    assert "Hidden Mug" not in names


def test_active_reference_cannot_be_deleted_directly(client, db):
    admin = make_admin(db)
    login_client(client, db, admin)
    ref = make_reference(client, name="Protected Mug")

    res = client.delete(f"/admin/references/{ref['id']}")
    assert res.status_code == 400


def test_deactivated_reference_can_be_deleted(client, db):
    admin = make_admin(db)
    login_client(client, db, admin)
    ref = make_reference(client, name="Doomed Mug")
    client.post(f"/admin/references/{ref['id']}/deactivate")

    res = client.delete(f"/admin/references/{ref['id']}")
    assert res.status_code == 204

    get_res = client.get("/admin/references")
    names = [r["name"] for r in get_res.json()]
    assert "Doomed Mug" not in names


def test_reference_search_and_filter(client, db):
    admin = make_admin(db)
    login_client(client, db, admin)
    make_reference(client, name="Zebra Mug", category="everyday")
    make_reference(client, name="Aardvark Fridge", category="large", shape="fridge")

    res = client.get("/admin/references?q=zebra")
    names = [r["name"] for r in res.json()]
    assert names == ["Zebra Mug"]

    res2 = client.get("/admin/references?category=large")
    names2 = [r["name"] for r in res2.json()]
    assert "Aardvark Fridge" in names2
    assert "Zebra Mug" not in names2
