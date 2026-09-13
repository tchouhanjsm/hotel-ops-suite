from sqlalchemy.orm import Session

from app.core.security import verify_password
from app.models.staff import Staff
from app.repositories.staff import StaffRepository


class AuthService:
    def __init__(self, db: Session) -> None:
        self.repository = StaffRepository(db)

    def authenticate(self, username: str, password: str) -> Staff | None:
        staff = self.repository.get_by_username(username)

        if staff is None or not staff.is_active:
            return None

        if not verify_password(password, staff.password_hash):
            return None

        return staff
