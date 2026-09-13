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


def test_list_staff_requires_permission() -> None:
    app.dependency_overrides[get_db] = override_get_db

    try:
        staff = create_test_staff("manager1", "manager")
        token = create_access_token(staff.id, staff.role)

        client = TestClient(app)

        response = client.get(
            "/staff",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        assert response.json()
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_create_staff_requires_create_permission() -> None:
    app.dependency_overrides[get_db] = override_get_db

    try:
        staff = create_test_staff("manager2", "manager")
        token = create_access_token(staff.id, staff.role)

        client = TestClient(app)

        response = client.post(
            "/staff",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "username": "newstaff",
                "password": "StrongPassword123!",
                "full_name": "New Staff",
                "role": "front_desk",
            },
        )

        assert response.status_code == 201
        assert response.json()["username"] == "newstaff"
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_front_desk_cannot_create_staff() -> None:
    app.dependency_overrides[get_db] = override_get_db

    try:
        staff = create_test_staff("frontdesk1", "front_desk")
        token = create_access_token(staff.id, staff.role)

        client = TestClient(app)

        response = client.post(
            "/staff",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "username": "blocked",
                "password": "StrongPassword123!",
                "full_name": "Blocked User",
                "role": "front_desk",
            },
        )

        assert response.status_code == 403
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_get_missing_staff() -> None:
    app.dependency_overrides[get_db] = override_get_db

    try:
        staff = create_test_staff("manager3", "manager")
        token = create_access_token(staff.id, staff.role)

        client = TestClient(app)

        response = client.get(
            "/staff/99999",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 404
    finally:
        app.dependency_overrides.pop(get_db, None)
