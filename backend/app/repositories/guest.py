from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.guest import Guest


class GuestRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, guest_id: int) -> Guest | None:
        return self.db.get(Guest, guest_id)

    def list_all(self) -> list[Guest]:
        statement = select(Guest).order_by(Guest.id)
        return list(self.db.scalars(statement).all())

    def search(self, query: str) -> list[Guest]:
        pattern = f"%{query}%"

        statement = (
            select(Guest)
            .where(
                (Guest.first_name.ilike(pattern))
                | (Guest.last_name.ilike(pattern))
                | (Guest.phone.ilike(pattern))
                | (Guest.email.ilike(pattern))
            )
            .order_by(Guest.id)
        )

        return list(self.db.scalars(statement).all())

    def create(
        self,
        first_name: str,
        last_name: str,
        phone: str,
        email: str | None,
        address: str | None,
        city: str | None,
        country: str | None,
        id_type: str | None,
        id_number: str | None,
        notes: str | None,
    ) -> Guest:
        guest = Guest(
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            email=email,
            address=address,
            city=city,
            country=country,
            id_type=id_type,
            id_number=id_number,
            notes=notes,
        )

        self.db.add(guest)
        self.db.flush()
        self.db.refresh(guest)

        return guest
