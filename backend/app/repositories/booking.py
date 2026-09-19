from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.booking import Booking

ACTIVE_BOOKING_STATUSES = (
    "confirmed",
    "checked_in",
)


class BookingRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, booking_id: int) -> Booking | None:
        return self.db.get(Booking, booking_id)

    def get_by_id_for_update(self, booking_id: int) -> Booking | None:
        statement = select(Booking).where(Booking.id == booking_id).with_for_update()
        return self.db.scalar(statement)

    def get_by_reference(self, reference: str) -> Booking | None:
        statement = select(Booking).where(Booking.booking_reference == reference)
        return self.db.scalar(statement)

    def list_all(self) -> list[Booking]:
        statement = select(Booking).order_by(Booking.id.desc())
        return list(self.db.scalars(statement).all())

    def find_overlapping(
        self,
        room_id: int,
        check_in: date,
        check_out: date,
        exclude_booking_id: int | None = None,
    ) -> list[Booking]:
        statement = select(Booking).where(
            Booking.room_id == room_id,
            Booking.status.in_(ACTIVE_BOOKING_STATUSES),
            Booking.check_in < check_out,
            Booking.check_out > check_in,
        )

        if exclude_booking_id is not None:
            statement = statement.where(
                Booking.id != exclude_booking_id,
            )

        return list(self.db.scalars(statement).all())

    def save(self, booking: Booking) -> Booking:
        self.db.flush()
        self.db.refresh(booking)
        return booking

    def create(
        self,
        booking_reference: str,
        guest_id: int,
        room_id: int,
        check_in: date,
        check_out: date,
        nights: int,
        rate,
        source: str,
        notes: str | None,
    ) -> Booking:
        booking = Booking(
            booking_reference=booking_reference,
            guest_id=guest_id,
            room_id=room_id,
            check_in=check_in,
            check_out=check_out,
            nights=nights,
            rate=rate,
            source=source,
            notes=notes,
        )

        self.db.add(booking)
        self.db.flush()
        self.db.refresh(booking)

        return booking
