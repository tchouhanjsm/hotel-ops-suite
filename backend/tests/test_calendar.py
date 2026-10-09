from datetime import date

from sqlalchemy.orm import Session

from app.core.outbox_processor import process_pending
from app.main import app
from app.repositories.booking_calendar import BookingCalendarRepository
from app.services.booking import BookingService


def test_calendar_projection_can_be_read_by_date_range(
    db_session: Session,
    booking_test_data,
) -> None:
    guest, room = booking_test_data

    booking = BookingService(db_session).create_booking(
        guest_id=guest.id,
        room_id=room.id,
        check_in=date(2026, 10, 10),
        check_out=date(2026, 10, 13),
        rate=4900,
        source="direct",
        notes=None,
    )

    assert process_pending(db_session) == 1

    entries = BookingCalendarRepository(db_session).list_entries(
        start_date=date(2026, 10, 1),
        end_date=date(2026, 11, 1),
    )

    assert len(entries) == 1
    assert entries[0].booking_id == booking.id
    assert entries[0].booking_reference == booking.booking_reference
    assert entries[0].guest_id == guest.id
    assert entries[0].room_id == room.id
    assert entries[0].check_in == date(2026, 10, 10)
    assert entries[0].check_out == date(2026, 10, 13)
    assert entries[0].status == "confirmed"


def test_calendar_date_range_uses_overlap_semantics(
    db_session: Session,
    booking_test_data,
) -> None:
    guest, room = booking_test_data

    BookingService(db_session).create_booking(
        guest_id=guest.id,
        room_id=room.id,
        check_in=date(2026, 10, 30),
        check_out=date(2026, 11, 3),
        rate=4900,
        source="direct",
        notes=None,
    )

    assert process_pending(db_session) == 1

    entries = BookingCalendarRepository(db_session).list_entries(
        start_date=date(2026, 11, 1),
        end_date=date(2026, 12, 1),
    )

    assert len(entries) == 1


def test_calendar_route_is_registered() -> None:
    paths = app.openapi()["paths"]

    assert "/calendar" in paths
    assert "get" in paths["/calendar"]


def test_calendar_projection_follows_booking_update_and_cancellation(
    db_session: Session,
    booking_test_data,
) -> None:
    guest, room = booking_test_data

    booking = BookingService(db_session).create_booking(
        guest_id=guest.id,
        room_id=room.id,
        check_in=date(2026, 10, 10),
        check_out=date(2026, 10, 13),
        rate=4900,
        source="direct",
        notes=None,
    )

    assert process_pending(db_session) == 1

    booking = BookingService(db_session).update_booking(
        booking_id=booking.id,
        check_in=date(2026, 10, 12),
        check_out=date(2026, 10, 15),
    )

    assert booking is not None
    assert process_pending(db_session) == 1

    projection = BookingCalendarRepository(db_session).list_entries(
        start_date=date(2026, 10, 1),
        end_date=date(2026, 11, 1),
    )

    assert len(projection) == 1
    assert projection[0].check_in == date(2026, 10, 12)
    assert projection[0].check_out == date(2026, 10, 15)
    assert projection[0].status == "confirmed"

    cancelled = BookingService(db_session).cancel_booking(booking.id)

    assert cancelled is not None
    assert process_pending(db_session) == 1

    projection = BookingCalendarRepository(db_session).list_entries(
        start_date=date(2026, 10, 1),
        end_date=date(2026, 11, 1),
    )

    assert len(projection) == 1
    assert projection[0].status == "cancelled"


def test_calendar_projection_follows_check_in_and_check_out(
    db_session: Session,
    booking_test_data,
) -> None:
    guest, room = booking_test_data

    booking = BookingService(db_session).create_booking(
        guest_id=guest.id,
        room_id=room.id,
        check_in=date(2026, 10, 20),
        check_out=date(2026, 10, 22),
        rate=4900,
        source="direct",
        notes=None,
    )

    assert process_pending(db_session) == 1

    checked_in = BookingService(db_session).check_in(booking.id)

    assert checked_in is not None
    assert process_pending(db_session) == 1

    projection = BookingCalendarRepository(db_session).list_entries(
        start_date=date(2026, 10, 1),
        end_date=date(2026, 11, 1),
    )

    assert len(projection) == 1
    assert projection[0].status == "checked_in"

    checked_out = BookingService(db_session).check_out(booking.id)

    assert checked_out is not None
    assert process_pending(db_session) == 1

    projection = BookingCalendarRepository(db_session).list_entries(
        start_date=date(2026, 10, 1),
        end_date=date(2026, 11, 1),
    )

    assert len(projection) == 1
    assert projection[0].status == "checked_out"
