from datetime import date

from sqlalchemy.orm import Session

from app.core.dates import validate_date_range
from app.core.errors import ConflictError, NotFoundError, StateError
from app.core.identifiers import generate_reference
from app.models.booking import Booking
from app.repositories.booking import BookingRepository
from app.repositories.guest import GuestRepository
from app.repositories.room import RoomRepository


class BookingService:
    def __init__(self, db: Session) -> None:
        self.repository = BookingRepository(db)
        self.guest_repository = GuestRepository(db)
        self.room_repository = RoomRepository(db)

    def _generate_reference(self) -> str:
        while True:
            reference = generate_reference("BK")

            if self.repository.get_by_reference(reference) is None:
                return reference

    def list_bookings(self) -> list[Booking]:
        return self.repository.list_all()

    def get_booking(self, booking_id: int) -> Booking | None:
        return self.repository.get_by_id(booking_id)

    def is_room_available(
        self,
        room_id: int,
        check_in: date,
        check_out: date,
        exclude_booking_id: int | None = None,
    ) -> bool:
        room = self.room_repository.get_by_id(room_id)

        if room is None or not room.is_active:
            return False

        conflicts = self.repository.find_overlapping(
            room_id=room_id,
            check_in=check_in,
            check_out=check_out,
            exclude_booking_id=exclude_booking_id,
        )

        return not conflicts

    def create_booking(
        self,
        guest_id: int,
        room_id: int,
        check_in: date,
        check_out: date,
        rate,
        source: str,
        notes: str | None,
    ) -> Booking:
        guest = self.guest_repository.get_by_id(guest_id)

        if guest is None or not guest.is_active:
            raise NotFoundError("Guest not found or inactive.")

        room = self.room_repository.get_by_id_for_update(room_id)

        if room is None or not room.is_active:
            raise NotFoundError("Room not found or inactive.")

        if room.status in {"maintenance", "out_of_order"}:
            raise StateError("Room is not available for booking.")

        validate_date_range(check_in, check_out)

        if not self.is_room_available(
            room_id=room_id,
            check_in=check_in,
            check_out=check_out,
        ):
            raise ConflictError("Room is already booked for the selected dates.")

        nights = validate_date_range(check_in, check_out).nights

        return self.repository.create(
            booking_reference=self._generate_reference(),
            guest_id=guest_id,
            room_id=room_id,
            check_in=check_in,
            check_out=check_out,
            nights=nights,
            rate=rate,
            source=source,
            notes=notes,
        )

    def update_booking(
        self,
        booking_id: int,
        room_id: int | None = None,
        check_in: date | None = None,
        check_out: date | None = None,
        rate=None,
        source: str | None = None,
        notes: str | None = None,
    ) -> Booking | None:
        booking = self.repository.get_by_id(booking_id)

        if booking is None:
            return None

        if booking.status != "confirmed":
            raise StateError("Only confirmed bookings can be updated.")

        new_room_id = room_id if room_id is not None else booking.room_id
        new_check_in = check_in if check_in is not None else booking.check_in
        new_check_out = check_out if check_out is not None else booking.check_out

        validate_date_range(new_check_in, new_check_out)

        room = self.room_repository.get_by_id_for_update(new_room_id)

        if room is None or not room.is_active:
            raise NotFoundError("Room not found or inactive.")

        if room.status in {"maintenance", "out_of_order"}:
            raise StateError("Room is not available for booking.")

        if not self.is_room_available(
            room_id=new_room_id,
            check_in=new_check_in,
            check_out=new_check_out,
            exclude_booking_id=booking.id,
        ):
            raise ConflictError("Room is already booked for the selected dates.")

        booking.room_id = new_room_id
        booking.check_in = new_check_in
        booking.check_out = new_check_out
        booking.nights = validate_date_range(
            new_check_in,
            new_check_out,
        ).nights

        if rate is not None:
            booking.rate = rate

        if source is not None:
            booking.source = source

        if notes is not None:
            booking.notes = notes

        return booking

    def cancel_booking(self, booking_id: int) -> Booking | None:
        booking = self.repository.get_by_id(booking_id)

        if booking is None:
            return None

        if booking.status != "confirmed":
            raise StateError("Booking cannot be cancelled.")

        booking.status = "cancelled"
        return booking

    def check_in(self, booking_id: int) -> Booking | None:
        booking = self.repository.get_by_id(booking_id)

        if booking is None:
            return None

        if booking.status != "confirmed":
            raise StateError("Only confirmed bookings can be checked in.")

        room = self.room_repository.get_by_id_for_update(booking.room_id)

        if room is None:
            raise NotFoundError("Room not found.")

        if not room.is_active:
            raise StateError("Room is inactive.")

        if room.status in {"maintenance", "out_of_order"}:
            raise StateError("Room is not available for check-in.")

        booking.status = "checked_in"
        room.status = "occupied"

        self.room_repository.save(room)
        return self.repository.save(booking)

    def check_out(self, booking_id: int) -> Booking | None:
        booking = self.repository.get_by_id(booking_id)

        if booking is None:
            return None

        if booking.status != "checked_in":
            raise StateError("Only checked-in bookings can be checked out.")

        booking.status = "checked_out"

        room = self.room_repository.get_by_id(booking.room_id)

        if room is not None:
            room.status = "dirty"
            self.room_repository.save(room)

        return self.repository.save(booking)
