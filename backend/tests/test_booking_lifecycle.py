from datetime import date

import pytest
from sqlalchemy.orm import Session

from app.core.errors import StateError
from app.services.booking import BookingService


def create_confirmed_booking(db_session: Session, booking_test_data):
    guest, room = booking_test_data

    return BookingService(db_session).create_booking(
        guest_id=guest.id,
        room_id=room.id,
        check_in=date(2027, 3, 10),
        check_out=date(2027, 3, 12),
        rate=4900,
        source="direct",
        notes=None,
    )


def test_check_in_moves_booking_and_room_to_occupied(
    db_session: Session,
    booking_test_data,
) -> None:
    booking = create_confirmed_booking(db_session, booking_test_data)
    db_session.commit()

    result = BookingService(db_session).check_in(booking.id)

    assert result is not None
    assert result.status == "checked_in"

    _, room = booking_test_data
    db_session.refresh(room)

    assert room.status == "occupied"


def test_check_out_moves_booking_and_room_to_dirty(
    db_session: Session,
    booking_test_data,
) -> None:
    booking = create_confirmed_booking(db_session, booking_test_data)
    db_session.commit()

    BookingService(db_session).check_in(booking.id)
    db_session.commit()

    result = BookingService(db_session).check_out(booking.id)

    assert result is not None
    assert result.status == "checked_out"

    _, room = booking_test_data
    db_session.refresh(room)

    assert room.status == "dirty"


def test_checked_in_booking_cannot_be_checked_in_again(
    db_session: Session,
    booking_test_data,
) -> None:
    booking = create_confirmed_booking(db_session, booking_test_data)
    db_session.commit()

    BookingService(db_session).check_in(booking.id)
    db_session.commit()

    with pytest.raises(
        StateError,
        match="Only confirmed bookings can be checked in.",
    ):
        BookingService(db_session).check_in(booking.id)


def test_confirmed_booking_can_be_cancelled(
    db_session: Session,
    booking_test_data,
) -> None:
    booking = create_confirmed_booking(db_session, booking_test_data)
    db_session.commit()

    result = BookingService(db_session).cancel_booking(booking.id)

    assert result is not None
    assert result.status == "cancelled"


def test_checked_in_booking_cannot_be_cancelled(
    db_session: Session,
    booking_test_data,
) -> None:
    booking = create_confirmed_booking(db_session, booking_test_data)
    db_session.commit()

    BookingService(db_session).check_in(booking.id)
    db_session.commit()

    with pytest.raises(
        StateError,
        match="Booking cannot be cancelled.",
    ):
        BookingService(db_session).cancel_booking(booking.id)


def test_maintenance_room_cannot_be_booked(
    db_session: Session,
    booking_test_data,
) -> None:
    guest, room = booking_test_data
    room.status = "maintenance"
    db_session.commit()

    with pytest.raises(
        StateError,
        match="Room is not available for booking.",
    ):
        BookingService(db_session).create_booking(
            guest_id=guest.id,
            room_id=room.id,
            check_in=date(2027, 4, 10),
            check_out=date(2027, 4, 12),
            rate=4900,
            source="direct",
            notes=None,
        )


def test_out_of_order_room_cannot_be_booked(
    db_session: Session,
    booking_test_data,
) -> None:
    guest, room = booking_test_data
    room.status = "out_of_order"
    db_session.commit()

    with pytest.raises(
        StateError,
        match="Room is not available for booking.",
    ):
        BookingService(db_session).create_booking(
            guest_id=guest.id,
            room_id=room.id,
            check_in=date(2027, 4, 10),
            check_out=date(2027, 4, 12),
            rate=4900,
            source="direct",
            notes=None,
        )


def test_maintenance_room_cannot_check_in(
    db_session: Session,
    booking_test_data,
) -> None:
    booking = create_confirmed_booking(db_session, booking_test_data)
    _, room = booking_test_data

    db_session.commit()

    room.status = "maintenance"
    db_session.commit()

    with pytest.raises(
        StateError,
        match="Room is not available for check-in.",
    ):
        BookingService(db_session).check_in(booking.id)


def test_out_of_order_room_cannot_check_in(
    db_session: Session,
    booking_test_data,
) -> None:
    booking = create_confirmed_booking(db_session, booking_test_data)
    _, room = booking_test_data

    db_session.commit()

    room.status = "out_of_order"
    db_session.commit()

    with pytest.raises(
        StateError,
        match="Room is not available for check-in.",
    ):
        BookingService(db_session).check_in(booking.id)
