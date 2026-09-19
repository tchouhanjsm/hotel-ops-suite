from sqlalchemy.orm import Session

from app.core.errors import ConflictError, ValidationError
from app.models.room import Room
from app.repositories.room import RoomRepository

VALID_STATUSES = {
    "available",
    "occupied",
    "dirty",
    "cleaning",
    "maintenance",
    "out_of_order",
}


class RoomService:
    def __init__(self, db: Session) -> None:
        self.repository = RoomRepository(db)

    def list_rooms(self) -> list[Room]:
        return self.repository.list_all()

    def get_room(self, room_id: int) -> Room | None:
        return self.repository.get_by_id(room_id)

    def create_room(
        self,
        room_number: str,
        room_name: str,
        room_type: str,
        floor: int,
        capacity: int,
        status: str = "available",
    ) -> Room:
        existing = self.repository.get_by_number(room_number)

        if existing is not None:
            raise ConflictError("Room number already exists.")

        if floor < 0:
            raise ValidationError("Floor cannot be negative.")

        if capacity < 1:
            raise ValidationError("Capacity must be at least 1.")

        if status not in VALID_STATUSES:
            raise ValidationError("Invalid room status.")

        return self.repository.create(
            room_number=room_number,
            room_name=room_name,
            room_type=room_type,
            floor=floor,
            capacity=capacity,
            status=status,
        )

    def update_room(
        self,
        room_id: int,
        room_name: str | None = None,
        room_type: str | None = None,
        floor: int | None = None,
        capacity: int | None = None,
        status: str | None = None,
        is_active: bool | None = None,
    ) -> Room | None:
        room = self.repository.get_by_id(room_id)

        if room is None:
            return None

        if floor is not None and floor < 0:
            raise ValidationError("Floor cannot be negative.")

        if capacity is not None and capacity < 1:
            raise ValidationError("Capacity must be at least 1.")

        if status is not None and status not in VALID_STATUSES:
            raise ValidationError("Invalid room status.")

        if room_name is not None:
            room.room_name = room_name

        if room_type is not None:
            room.room_type = room_type

        if floor is not None:
            room.floor = floor

        if capacity is not None:
            room.capacity = capacity

        if status is not None:
            room.status = status

        if is_active is not None:
            room.is_active = is_active

        return room
