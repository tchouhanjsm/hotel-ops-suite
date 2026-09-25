from sqlalchemy import delete, select

from app.db.session import SessionLocal
from app.models.booking import Booking
from app.models.booking_calendar_projection import BookingCalendarProjection
from app.repositories.booking_calendar import BookingCalendarRepository


def main() -> None:
    with SessionLocal() as db:
        bookings = list(
            db.scalars(
                select(Booking).order_by(Booking.id)
            ).all()
        )

        # Rebuild the derived read model from canonical Booking state.
        # The transaction keeps readers from seeing a partially rebuilt
        # PostgreSQL projection.
        db.execute(delete(BookingCalendarProjection))

        repository = BookingCalendarRepository(db)

        for booking in bookings:
            repository.upsert(
                booking_id=booking.id,
                booking_reference=booking.booking_reference,
                guest_id=booking.guest_id,
                room_id=booking.room_id,
                check_in=booking.check_in,
                check_out=booking.check_out,
                status=booking.status,
            )

        db.commit()

        print(
            f"Calendar projection rebuilt from {len(bookings)} bookings."
        )


if __name__ == "__main__":
    main()
