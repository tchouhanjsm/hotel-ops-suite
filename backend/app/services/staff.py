from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.staff import Staff
from app.repositories.staff import StaffRepository


class StaffService:
    def __init__(self, db: Session) -> None:
        self.repository = StaffRepository(db)

    def create_staff(
        self,
        username: str,
        password: str,
        full_name: str,
        role: str,
    ) -> Staff:
        existing = self.repository.get_by_username(username)

        if existing is not None:
            raise ValueError("Username already exists.")

        password_hash = hash_password(password)

        return self.repository.create(
            username=username,
            password_hash=password_hash,
            full_name=full_name,
            role=role,
        )
