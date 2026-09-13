from app.core.rbac import ROLE_PERMISSIONS


def test_admin_permissions() -> None:
    assert "staff:read" in ROLE_PERMISSIONS["admin"]
    assert "staff:create" in ROLE_PERMISSIONS["admin"]


def test_front_desk_permissions() -> None:
    assert "staff:read" in ROLE_PERMISSIONS["front_desk"]
    assert "staff:create" not in ROLE_PERMISSIONS["front_desk"]


def test_unknown_role_has_no_permissions() -> None:
    assert ROLE_PERMISSIONS.get("unknown", set()) == set()
