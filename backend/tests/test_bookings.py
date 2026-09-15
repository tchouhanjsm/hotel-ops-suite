from datetime import date

import pytest
from sqlalchemy.orm import Session

from app.services.booking import BookingService


def test_create_booking(
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
        notes="Test booking",
    )

    assert booking.booking_reference.startswith("BK-")
    assert booking.nights == 3
    assert booking.status == "confirmed"


def test_overlapping_booking_is_rejected(
    db_session: Session,
    booking_test_data,
) -> None:
    guest, room = booking_test_data

    BookingService(db_session).create_booking(
        guest_id=guest.id,
        room_id=room.id,
        check_in=date(2026, 11, 10),
        check_out=date(2026, 11, 13),
        rate=4900,
        source="direct",
        notes=None,
    )
    db_session.commit()

    with pytest.raises(
        ValueError,
        match="Room is already booked for the selected dates.",
    ):
        BookingService(db_session).create_booking(
            guest_id=guest.id,
            room_id=room.id,
            check_in=date(2026, 11, 12),
            check_out=date(2026, 11, 15),
            rate=4900,
            source="direct",
            notes=None,
        )


def test_back_to_back_booking_is_allowed(
    db_session: Session,
    booking_test_data,
) -> None:
    guest, room = booking_test_data

    BookingService(db_session).create_booking(
        guest_id=guest.id,
        room_id=room.id,
        check_in=date(2026, 12, 10),
        check_out=date(2026, 12, 13),
        rate=4900,
        source="direct",
        notes=None,
    )
    db_session.commit()

    booking = BookingService(db_session).create_booking(
        guest_id=guest.id,
        room_id=room.id,
        check_in=date(2026, 12, 13),
        check_out=date(2026, 12, 15),
        rate=4900,
        source="direct",
        notes=None,
    )

    assert booking.nights == 2


def test_cancel_booking(
    db_session: Session,
    booking_test_data,
) -> None:
    guest, room = booking_test_data

    booking = BookingService(db_session).create_booking(
        guest_id=guest.id,
        room_id=room.id,
        check_in=date(2027, 1, 10),
        check_out=date(2027, 1, 12),
        rate=4900,
        source="direct",
        notes=None,
    )
    db_session.commit()

    cancelled = BookingService(db_session).cancel_booking(booking.id)

    assert cancelled is not None
    assert cancelled.status == "cancelled"


def test_inactive_guest_cannot_book(
    db_session: Session,
    booking_test_data,
) -> None:
    guest, room = booking_test_data

    guest.is_active = False
    db_session.commit()

    with pytest.raises(
        ValueError,
        match="Guest not found or inactive.",
    ):
        BookingService(db_session).create_booking(
            guest_id=guest.id,
            room_id=room.id,
            check_in=date(2027, 2, 10),
            check_out=date(2027, 2, 12),
            rate=4900,
            source="direct",
            notes=None,
        )
