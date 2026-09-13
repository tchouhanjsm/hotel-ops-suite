from datetime import date

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


def clean_database() -> None:
    with Session(engine) as db:
        db.execute(delete(Booking))
        db.execute(delete(Guest))
        db.execute(delete(Room))
        db.commit()


def setup_data(db: Session) -> tuple[Guest, Room]:
    guest = Guest(
        first_name="Lifecycle",
        last_name="Guest",
        phone="9000000011",
    )

    room = Room(
        room_number="301",
        room_name="Lifecycle Room",
        room_type="Heritage",
        floor=3,
        capacity=2,
    )

    db.add_all([guest, room])
    db.commit()
    db.refresh(guest)
    db.refresh(room)

    return guest, room


def test_update_booking_changes_nights() -> None:
    clean_database()

    with Session(engine) as db:
        guest, room = setup_data(db)

        booking = BookingService(db).create_booking(
            guest.id,
            room.id,
            date(2027, 3, 1),
            date(2027, 3, 3),
            4900,
            "direct",
            None,
        )
        db.commit()

        updated = BookingService(db).update_booking(
            booking.id,
            check_out=date(2027, 3, 5),
        )

        assert updated is not None
        assert updated.nights == 4


def test_update_booking_rejects_conflict() -> None:
    clean_database()

    with Session(engine) as db:
        guest, room = setup_data(db)

        first = BookingService(db).create_booking(
            guest.id,
            room.id,
            date(2027, 4, 1),
            date(2027, 4, 5),
            4900,
            "direct",
            None,
        )

        second = BookingService(db).create_booking(
            guest.id,
            room.id,
            date(2027, 4, 10),
            date(2027, 4, 12),
            4900,
            "direct",
            None,
        )
        db.commit()

        assert first.id != second.id

        try:
            BookingService(db).update_booking(
                second.id,
                check_in=date(2027, 4, 3),
            )
            assert False
        except ValueError as exc:
            assert str(exc) == "Room is already booked for the selected dates."


def test_check_in_changes_room_status() -> None:
    clean_database()

    with Session(engine) as db:
        guest, room = setup_data(db)

        booking = BookingService(db).create_booking(
            guest.id,
            room.id,
            date(2027, 5, 1),
            date(2027, 5, 3),
            4900,
            "direct",
            None,
        )
        db.commit()

        checked_in = BookingService(db).check_in(booking.id)

        assert checked_in is not None
        assert checked_in.status == "checked_in"

        db.refresh(room)
        assert room.status == "occupied"


def test_check_out_changes_room_status() -> None:
    clean_database()

    with Session(engine) as db:
        guest, room = setup_data(db)

        booking = BookingService(db).create_booking(
            guest.id,
            room.id,
            date(2027, 6, 1),
            date(2027, 6, 3),
            4900,
            "direct",
            None,
        )
        db.commit()

        BookingService(db).check_in(booking.id)
        db.commit()

        checked_out = BookingService(db).check_out(booking.id)

        assert checked_out is not None
        assert checked_out.status == "checked_out"

        db.refresh(room)
        assert room.status == "dirty"


def test_cancelled_booking_frees_room() -> None:
    clean_database()

    with Session(engine) as db:
        guest, room = setup_data(db)

        booking = BookingService(db).create_booking(
            guest.id,
            room.id,
            date(2027, 7, 1),
            date(2027, 7, 3),
            4900,
            "direct",
            None,
        )
        db.commit()

        BookingService(db).cancel_booking(booking.id)
        db.commit()

        replacement = BookingService(db).create_booking(
            guest.id,
            room.id,
            date(2027, 7, 1),
            date(2027, 7, 3),
            4900,
            "direct",
            None,
        )

        assert replacement.id != booking.id
