from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.core.errors import ConflictError
from app.db.base import Base
from app.services.staff import StaffService

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

Base.metadata.create_all(engine)


def test_create_staff() -> None:
    with Session(engine) as db:
        service = StaffService(db)

        staff = service.create_staff(
            username="admin",
            password="password123",
            full_name="Administrator",
            role="admin",
        )

        assert staff.username == "admin"
        assert staff.full_name == "Administrator"
        assert staff.role == "admin"


def test_duplicate_username_rejected() -> None:
    with Session(engine) as db:
        service = StaffService(db)

        service.create_staff(
            username="admin",
            password="password123",
            full_name="Administrator",
            role="admin",
        )
        db.commit()

        try:
            service.create_staff(
                username="admin",
                password="password123",
                full_name="Second Admin",
                role="admin",
            )
            raise AssertionError()
        except ConflictError as exc:
            assert str(exc) == "Username already exists."
