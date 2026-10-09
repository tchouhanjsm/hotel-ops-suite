from datetime import date

from sqlalchemy.orm import Session

from app.core.events import DomainEvent
from app.repositories.booking_calendar import BookingCalendarRepository

BOOKING_CALENDAR_EVENTS = {
    "BookingCreated",
    "BookingUpdated",
    "BookingCancelled",
    "BookingCheckedIn",
    "BookingCheckedOut",
}


def dispatch(event: DomainEvent, db: Session) -> None:
    if event.event_type not in BOOKING_CALENDAR_EVENTS:
        return

    BookingCalendarRepository(db).upsert(
        booking_id=int(event.payload["booking_id"]),
        booking_reference=str(event.payload["booking_reference"]),
        guest_id=int(event.payload["guest_id"]),
        room_id=int(event.payload["room_id"]),
        check_in=date.fromisoformat(str(event.payload["check_in"])),
        check_out=date.fromisoformat(str(event.payload["check_out"])),
        status=str(event.payload["status"]),
    )
