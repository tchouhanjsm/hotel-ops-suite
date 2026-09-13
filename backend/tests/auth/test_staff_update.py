from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.api.dependencies import get_db
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


def create_test_staff(username: str, role: str) -> Staff:
    with Session(engine) as db:
        staff = Staff(
            username=username,
            password_hash=hash_password("StrongPassword123!"),
            full_name=username.title(),
            role=role,
        )
        db.add(staff)
        db.commit()
        db.refresh(staff)
        return staff


def test_update_staff() -> None:
    app.dependency_overrides[get_db] = override_get_db

    try:
        manager = create_test_staff("manager_update", "manager")
        target = create_test_staff("target_update", "front_desk")
        token = create_access_token(manager.id, manager.role)

        client = TestClient(app)

        response = client.patch(
            f"/staff/{target.id}",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "full_name": "Updated Name",
                "role": "manager",
            },
        )

        assert response.status_code == 200
        assert response.json()["full_name"] == "Updated Name"
        assert response.json()["role"] == "manager"
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_deactivate_staff() -> None:
    app.dependency_overrides[get_db] = override_get_db

    try:
        manager = create_test_staff("manager_deactivate", "manager")
        target = create_test_staff("target_deactivate", "front_desk")
        token = create_access_token(manager.id, manager.role)

        client = TestClient(app)

        response = client.post(
            f"/staff/{target.id}/deactivate",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        assert response.json()["is_active"] is False
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_front_desk_cannot_update_staff() -> None:
    app.dependency_overrides[get_db] = override_get_db

    try:
        front_desk = create_test_staff("frontdesk_update", "front_desk")
        target = create_test_staff("target_frontdesk", "manager")
        token = create_access_token(front_desk.id, front_desk.role)

        client = TestClient(app)

        response = client.patch(
            f"/staff/{target.id}",
            headers={"Authorization": f"Bearer {token}"},
            json={"full_name": "Blocked"},
        )

        assert response.status_code == 403
    finally:
        app.dependency_overrides.pop(get_db, None)
