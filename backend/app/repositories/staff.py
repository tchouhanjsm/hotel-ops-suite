from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.staff import Staff


class StaffRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_username(self, username: str) -> Staff | None:
        statement = select(Staff).where(Staff.username == username)
        return self.db.scalar(statement)

    def get_by_id(self, staff_id: int) -> Staff | None:
        return self.db.get(Staff, staff_id)

    def list_all(self) -> list[Staff]:
        statement = select(Staff).order_by(Staff.id)
        return list(self.db.scalars(statement).all())

    def create(
        self,
        username: str,
        password_hash: str,
        full_name: str,
        role: str,
    ) -> Staff:
        staff = Staff(
            username=username,
            password_hash=password_hash,
            full_name=full_name,
            role=role,
        )

        self.db.add(staff)
        self.db.flush()
        self.db.refresh(staff)

        return staff
