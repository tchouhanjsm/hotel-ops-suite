from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.base import Base
from app.models.staff import Staff
from app.services.auth import AuthService


def test_authenticate_valid_staff() -> None:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)

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

        service = AuthService(db)

        staff = service.authenticate(
            "admin",
            "StrongPassword123!",
        )

        assert staff is not None
        assert staff.username == "admin"


def test_authenticate_invalid_password() -> None:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)

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

        service = AuthService(db)

        staff = service.authenticate(
            "admin",
            "WrongPassword123!",
        )

        assert staff is None
