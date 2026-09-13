from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.api.dependencies import get_db
from app.core.security import hash_password
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


def test_login_success() -> None:
    with Session(engine) as db:
        db.add(
            Staff(
                username="login_admin",
                password_hash=hash_password("StrongPassword123!"),
                full_name="System Admin",
                role="admin",
            )
        )
        db.commit()

    app.dependency_overrides[get_db] = override_get_db

    try:
        client = TestClient(app)

        response = client.post(
            "/auth/login",
            json={
                "username": "login_admin",
                "password": "StrongPassword123!",
            },
        )

        assert response.status_code == 200

        data = response.json()

        assert data["token_type"] == "bearer"
        assert data["access_token"]
        assert data["staff"]["username"] == "login_admin"
        assert data["staff"]["role"] == "admin"
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_login_failure() -> None:
    app.dependency_overrides[get_db] = override_get_db

    try:
        client = TestClient(app)

        response = client.post(
            "/auth/login",
            json={
                "username": "login_admin",
                "password": "WrongPassword123!",
            },
        )

        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid username or password."
    finally:
        app.dependency_overrides.pop(get_db, None)
