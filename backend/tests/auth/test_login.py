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


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def test_login_success() -> None:
    with Session(engine) as db:
        db.add(
            Staff(
                username="admin",
                password_hash=hash_password("StrongPassword123!"),
                full_name="System Admin",
                role="admin",
            )
        )
        db.commit()

    response = client.post(
        "/auth/login",
        json={
            "username": "admin",
            "password": "StrongPassword123!",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["token_type"] == "bearer"
    assert data["access_token"]
    assert data["staff"]["username"] == "admin"
    assert data["staff"]["role"] == "admin"


def test_login_failure() -> None:
    response = client.post(
        "/auth/login",
        json={
            "username": "admin",
            "password": "WrongPassword123!",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid username or password."
