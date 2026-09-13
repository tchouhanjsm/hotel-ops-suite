from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.api.dependencies import get_db
from app.core.security import create_access_token, hash_password
from app.db.base import Base
from app.main import app
from app.models.room import Room
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


def create_staff(username: str, role: str) -> Staff:
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


def test_create_room() -> None:
    app.dependency_overrides[get_db] = override_get_db

    try:
        staff = create_staff("room_manager", "manager")
        token = create_access_token(staff.id, staff.role)
        client = TestClient(app)

        response = client.post(
            "/rooms",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "room_number": "101",
                "room_name": "Sunrise",
                "room_type": "Heritage",
                "floor": 1,
                "capacity": 2,
            },
        )

        assert response.status_code == 201
        assert response.json()["room_number"] == "101"
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_duplicate_room_number() -> None:
    app.dependency_overrides[get_db] = override_get_db

    try:
        staff = create_staff("duplicate_manager", "manager")
        token = create_access_token(staff.id, staff.role)
        client = TestClient(app)

        payload = {
            "room_number": "102",
            "room_name": "Purple",
            "room_type": "Heritage",
            "floor": 1,
            "capacity": 2,
        }

        first = client.post(
            "/rooms",
            headers={"Authorization": f"Bearer {token}"},
            json=payload,
        )
        second = client.post(
            "/rooms",
            headers={"Authorization": f"Bearer {token}"},
            json=payload,
        )

        assert first.status_code == 201
        assert second.status_code == 409
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_invalid_room_capacity() -> None:
    app.dependency_overrides[get_db] = override_get_db

    try:
        staff = create_staff("invalid_manager", "manager")
        token = create_access_token(staff.id, staff.role)
        client = TestClient(app)

        response = client.post(
            "/rooms",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "room_number": "103",
                "room_name": "Scarlet",
                "room_type": "Heritage",
                "floor": 1,
                "capacity": 0,
            },
        )

        assert response.status_code == 422
        assert response.json()["detail"][0]["type"] == "greater_than_equal"
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_front_desk_cannot_create_room() -> None:
    app.dependency_overrides[get_db] = override_get_db

    try:
        staff = create_staff("room_frontdesk", "front_desk")
        token = create_access_token(staff.id, staff.role)
        client = TestClient(app)

        response = client.post(
            "/rooms",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "room_number": "104",
                "room_name": "Blue",
                "room_type": "Heritage",
                "floor": 1,
                "capacity": 2,
            },
        )

        assert response.status_code == 403
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_update_room() -> None:
    app.dependency_overrides[get_db] = override_get_db

    try:
        staff = create_staff("update_manager", "manager")

        with Session(engine) as db:
            room = Room(
                room_number="105",
                room_name="Green",
                room_type="Heritage",
                floor=1,
                capacity=2,
            )
            db.add(room)
            db.commit()
            db.refresh(room)

            room_id = room.id

        token = create_access_token(staff.id, staff.role)
        client = TestClient(app)

        response = client.patch(
            f"/rooms/{room_id}",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "room_name": "Updated Green",
                "capacity": 3,
            },
        )

        assert response.status_code == 200
        assert response.json()["room_name"] == "Updated Green"
        assert response.json()["capacity"] == 3
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_get_missing_room() -> None:
    app.dependency_overrides[get_db] = override_get_db

    try:
        staff = create_staff("missing_manager", "manager")
        token = create_access_token(staff.id, staff.role)
        client = TestClient(app)

        response = client.get(
            "/rooms/99999",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 404
    finally:
        app.dependency_overrides.pop(get_db, None)
