from datetime import date

import pytest
from sqlalchemy import create_engine, delete
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.models.booking import Booking
from app.models.guest import Guest
from app.models.room import Room
from app.services.booking import BookingService

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

Base.metadata.create_all(engine)


@pytest.fixture(autouse=True)
def clean_database() -> None:
    with Session(engine) as db:
        db.execute(delete(Booking))
        db.execute(delete(Guest))
        db.execute(delete(Room))
        db.commit()


def setup_data(db: Session) -> tuple[Guest, Room]:
    guest = Guest(
        first_name="Test",
        last_name="Guest",
        phone="9000000000",
    )

    room = Room(
        room_number="201",
        room_name="Test Room",
        room_type="Heritage",
        floor=2,
        capacity=2,
    )

    db.add_all([guest, room])
    db.commit()

    db.refresh(guest)
    db.refresh(room)

    return guest, room


def test_create_booking() -> None:
    with Session(engine) as db:
        guest, room = setup_data(db)

        booking = BookingService(db).create_booking(
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


def test_overlapping_booking_is_rejected() -> None:
    with Session(engine) as db:
        guest, room = setup_data(db)

        BookingService(db).create_booking(
            guest_id=guest.id,
            room_id=room.id,
            check_in=date(2026, 11, 10),
            check_out=date(2026, 11, 13),
            rate=4900,
            source="direct",
            notes=None,
        )

        db.commit()

        with pytest.raises(
            ValueError,
            match="Room is already booked for the selected dates.",
        ):
            BookingService(db).create_booking(
                guest_id=guest.id,
                room_id=room.id,
                check_in=date(2026, 11, 12),
                check_out=date(2026, 11, 15),
                rate=4900,
                source="direct",
                notes=None,
            )


def test_back_to_back_booking_is_allowed() -> None:
    with Session(engine) as db:
        guest, room = setup_data(db)

        BookingService(db).create_booking(
            guest_id=guest.id,
            room_id=room.id,
            check_in=date(2026, 12, 10),
            check_out=date(2026, 12, 13),
            rate=4900,
            source="direct",
            notes=None,
        )

        db.commit()

        booking = BookingService(db).create_booking(
            guest_id=guest.id,
            room_id=room.id,
            check_in=date(2026, 12, 13),
            check_out=date(2026, 12, 15),
            rate=4900,
            source="direct",
            notes=None,
        )

        assert booking.nights == 2


def test_cancel_booking() -> None:
    with Session(engine) as db:
        guest, room = setup_data(db)

        booking = BookingService(db).create_booking(
            guest_id=guest.id,
            room_id=room.id,
            check_in=date(2027, 1, 10),
            check_out=date(2027, 1, 12),
            rate=4900,
            source="direct",
            notes=None,
        )

        db.commit()

        cancelled = BookingService(db).cancel_booking(booking.id)

        assert cancelled is not None
        assert cancelled.status == "cancelled"


def test_inactive_guest_cannot_book() -> None:
    with Session(engine) as db:
        guest, room = setup_data(db)
        guest.is_active = False
        db.commit()

        with pytest.raises(
            ValueError,
            match="Guest not found or inactive.",
        ):
            BookingService(db).create_booking(
                guest_id=guest.id,
                room_id=room.id,
                check_in=date(2027, 2, 10),
                check_out=date(2027, 2, 12),
                rate=4900,
                source="direct",
                notes=None,
            )
