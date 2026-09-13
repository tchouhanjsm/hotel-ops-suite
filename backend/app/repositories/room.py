from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.room import Room


class RoomRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, room_id: int) -> Room | None:
        return self.db.get(Room, room_id)

    def get_by_number(self, room_number: str) -> Room | None:
        statement = select(Room).where(Room.room_number == room_number)
        return self.db.scalar(statement)

    def list_all(self) -> list[Room]:
        statement = select(Room).order_by(Room.room_number)
        return list(self.db.scalars(statement).all())

    def create(
        self,
        room_number: str,
        room_name: str,
        room_type: str,
        floor: int,
        capacity: int,
        status: str,
    ) -> Room:
        room = Room(
            room_number=room_number,
            room_name=room_name,
            room_type=room_type,
            floor=floor,
            capacity=capacity,
            status=status,
        )

        self.db.add(room)
        self.db.flush()
        self.db.refresh(room)

        return room
