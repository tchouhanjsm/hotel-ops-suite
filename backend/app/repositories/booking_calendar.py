from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.booking_calendar_projection import BookingCalendarProjection


class BookingCalendarRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def upsert(
        self,
        booking_id: int,
        booking_reference: str,
        guest_id: int,
        room_id: int,
        check_in,
        check_out,
        status: str,
    ) -> BookingCalendarProjection:
        projection = self.db.scalar(
            select(BookingCalendarProjection).where(
                BookingCalendarProjection.booking_id == booking_id,
            )
        )

        if projection is None:
            projection = BookingCalendarProjection(
                booking_id=booking_id,
                booking_reference=booking_reference,
                guest_id=guest_id,
                room_id=room_id,
                check_in=check_in,
                check_out=check_out,
                status=status,
            )
            self.db.add(projection)
        else:
            projection.booking_reference = booking_reference
            projection.guest_id = guest_id
            projection.room_id = room_id
            projection.check_in = check_in
            projection.check_out = check_out
            projection.status = status

        self.db.flush()
        return projection

    def list_entries(
        self,
        start_date: date,
        end_date: date,
        room_id: int | None = None,
        status: str | None = None,
    ) -> list[BookingCalendarProjection]:
        statement = (
            select(BookingCalendarProjection)
            .where(
                BookingCalendarProjection.check_in < end_date,
                BookingCalendarProjection.check_out > start_date,
            )
            .order_by(
                BookingCalendarProjection.check_in,
                BookingCalendarProjection.room_id,
                BookingCalendarProjection.booking_id,
            )
        )

        if room_id is not None:
            statement = statement.where(
                BookingCalendarProjection.room_id == room_id
            )

        if status is not None:
            statement = statement.where(
                BookingCalendarProjection.status == status
            )

        return list(self.db.scalars(statement).all())
