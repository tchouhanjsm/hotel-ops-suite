from sqlalchemy.orm import Session

from app.models.guest import Guest
from app.repositories.guest import GuestRepository


class GuestService:
    def __init__(self, db: Session) -> None:
        self.repository = GuestRepository(db)

    def list_guests(self) -> list[Guest]:
        return self.repository.list_all()

    def search_guests(self, query: str) -> list[Guest]:
        return self.repository.search(query)

    def get_guest(self, guest_id: int) -> Guest | None:
        return self.repository.get_by_id(guest_id)

    def create_guest(
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
        return self.repository.create(
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

    def update_guest(
        self,
        guest_id: int,
        first_name: str | None = None,
        last_name: str | None = None,
        phone: str | None = None,
        email: str | None = None,
        address: str | None = None,
        city: str | None = None,
        country: str | None = None,
        id_type: str | None = None,
        id_number: str | None = None,
        notes: str | None = None,
        is_active: bool | None = None,
    ) -> Guest | None:
        guest = self.repository.get_by_id(guest_id)

        if guest is None:
            return None

        if first_name is not None:
            guest.first_name = first_name
        if last_name is not None:
            guest.last_name = last_name
        if phone is not None:
            guest.phone = phone
        if email is not None:
            guest.email = email
        if address is not None:
            guest.address = address
        if city is not None:
            guest.city = city
        if country is not None:
            guest.country = country
        if id_type is not None:
            guest.id_type = id_type
        if id_number is not None:
            guest.id_number = id_number
        if notes is not None:
            guest.notes = notes
        if is_active is not None:
            guest.is_active = is_active

        self.repository.db.flush()
        self.repository.db.refresh(guest)

        return guest
