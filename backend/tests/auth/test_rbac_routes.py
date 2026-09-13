from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.api.dependencies import get_db
from app.core.rbac import ROLE_PERMISSIONS
from app.core.security import create_access_token, hash_password
from app.db.base import Base
from app.main import app
from app.models.staff import Staff

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

Base.metadata.create_all(engine)


def override_get_db():
    with Session(engine) as db:
        yield db


def test_protected_route_allows_authorized_role() -> None:
    app.dependency_overrides[get_db] = override_get_db

    try:
        with Session(engine) as db:
            staff = Staff(
                username="manager",
                password_hash=hash_password("StrongPassword123!"),
                full_name="Manager",
                role="manager",
            )
            db.add(staff)
            db.commit()
            db.refresh(staff)

            token = create_access_token(staff.id, staff.role)

        client = TestClient(app)

        response = client.get(
            "/staff/protected",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        assert response.json()["staff_id"] == staff.id
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_protected_route_rejects_unauthorized_role() -> None:
    app.dependency_overrides[get_db] = override_get_db

    try:
        with Session(engine) as db:
            staff = Staff(
                username="restricted",
                password_hash=hash_password("StrongPassword123!"),
                full_name="Restricted User",
                role="unknown",
            )
            db.add(staff)
            db.commit()
            db.refresh(staff)

            token = create_access_token(staff.id, staff.role)

        client = TestClient(app)

        response = client.get(
            "/staff/protected",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 403
        assert response.json()["detail"] == "Insufficient permissions."
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_current_staff_requires_authentication() -> None:
    client = TestClient(app)

    response = client.get("/staff/me")

    assert response.status_code == 401


def test_front_desk_has_read_permission() -> None:
    assert "staff:read" in ROLE_PERMISSIONS["front_desk"]
