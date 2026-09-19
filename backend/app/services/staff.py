from sqlalchemy.orm import Session

from app.core.errors import ConflictError
from app.core.security import hash_password
from app.models.staff import Staff
from app.repositories.staff import StaffRepository


class StaffService:
    def __init__(self, db: Session) -> None:
        self.repository = StaffRepository(db)

    def list_staff(self) -> list[Staff]:
        return self.repository.list_all()

    def get_staff(self, staff_id: int) -> Staff | None:
        return self.repository.get_by_id(staff_id)

    def create_staff(
        self,
        username: str,
        password: str,
        full_name: str,
        role: str,
    ) -> Staff:
        existing = self.repository.get_by_username(username)

        if existing is not None:
            raise ConflictError("Username already exists.")

        password_hash = hash_password(password)

        return self.repository.create(
            username=username,
            password_hash=password_hash,
            full_name=full_name,
            role=role,
        )

    def update_staff(
        self,
        staff_id: int,
        full_name: str | None = None,
        role: str | None = None,
        is_active: bool | None = None,
    ) -> Staff | None:
        staff = self.repository.get_by_id(staff_id)

        if staff is None:
            return None

        if full_name is not None:
            staff.full_name = full_name

        if role is not None:
            staff.role = role

        if is_active is not None:
            staff.is_active = is_active

        return staff
