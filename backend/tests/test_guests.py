from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.api.dependencies import get_db
from app.core.security import create_access_token, hash_password
from app.db.base import Base
from app.main import app
from app.models.guest import Guest
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


def test_create_guest() -> None:
    app.dependency_overrides[get_db] = override_get_db

    try:
        staff = create_staff("guest_manager", "manager")
        token = create_access_token(staff.id, staff.role)
        client = TestClient(app)

        response = client.post(
            "/guests",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "first_name": "John",
                "last_name": "Doe",
                "phone": "+919876543210",
                "email": "john@example.com",
                "city": "Jaisalmer",
                "country": "India",
            },
        )

        assert response.status_code == 201
        assert response.json()["first_name"] == "John"
        assert response.json()["email"] == "john@example.com"
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_list_and_search_guests() -> None:
    app.dependency_overrides[get_db] = override_get_db

    try:
        staff = create_staff("guest_search", "front_desk")

        with Session(engine) as db:
            db.add_all(
                [
                    Guest(
                        first_name="Alice",
                        last_name="Sharma",
                        phone="9000000001",
                    ),
                    Guest(
                        first_name="Robert",
                        last_name="Smith",
                        phone="9000000002",
                    ),
                ]
            )
            db.commit()

        token = create_access_token(staff.id, staff.role)
        client = TestClient(app)

        response = client.get(
            "/guests",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        assert len(response.json()) >= 2

        response = client.get(
            "/guests?query=Alice",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["first_name"] == "Alice"
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_update_guest() -> None:
    app.dependency_overrides[get_db] = override_get_db

    try:
        staff = create_staff("guest_update", "front_desk")

        with Session(engine) as db:
            guest = Guest(
                first_name="Old",
                last_name="Name",
                phone="9000000003",
            )
            db.add(guest)
            db.commit()
            db.refresh(guest)
            guest_id = guest.id

        token = create_access_token(staff.id, staff.role)
        client = TestClient(app)

        response = client.patch(
            f"/guests/{guest_id}",
            headers={"Authorization": f"Bearer {token}"},
            json={"first_name": "New"},
        )

        assert response.status_code == 200
        assert response.json()["first_name"] == "New"
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_front_desk_cannot_access_invalid_guest_create_fields() -> None:
    app.dependency_overrides[get_db] = override_get_db

    try:
        staff = create_staff("guest_validation", "front_desk")
        token = create_access_token(staff.id, staff.role)
        client = TestClient(app)

        response = client.post(
            "/guests",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "first_name": "",
                "last_name": "Doe",
                "phone": "123",
            },
        )

        assert response.status_code == 422
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_missing_guest() -> None:
    app.dependency_overrides[get_db] = override_get_db

    try:
        staff = create_staff("guest_missing", "front_desk")
        token = create_access_token(staff.id, staff.role)
        client = TestClient(app)

        response = client.get(
            "/guests/99999",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 404
    finally:
        app.dependency_overrides.pop(get_db, None)
