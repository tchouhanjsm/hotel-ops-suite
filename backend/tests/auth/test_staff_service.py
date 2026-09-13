from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db.base import Base
from app.models.staff import Staff
from app.services.staff import StaffService


def test_create_staff() -> None:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)

    with Session(engine) as db:
        service = StaffService(db)

        staff = service.create_staff(
            username="admin",
            password="StrongPassword123!",
            full_name="System Admin",
            role="admin",
        )

        assert staff.username == "admin"
        assert staff.full_name == "System Admin"
        assert staff.role == "admin"
        assert staff.password_hash != "StrongPassword123!"

        db.commit()


def test_duplicate_username() -> None:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)

    with Session(engine) as db:
        service = StaffService(db)

        service.create_staff(
            username="admin",
            password="StrongPassword123!",
            full_name="System Admin",
            role="admin",
        )

        try:
            service.create_staff(
                username="admin",
                password="AnotherPassword123!",
                full_name="Another Admin",
                role="admin",
            )
            assert False
        except ValueError as exc:
            assert str(exc) == "Username already exists."


__all__ = ["Staff"]
