from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class RoomStatus(StrEnum):
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    DIRTY = "dirty"
    CLEANING = "cleaning"
    MAINTENANCE = "maintenance"
    OUT_OF_ORDER = "out_of_order"


class RoomBase(BaseModel):
    room_number: str
    room_name: str
    room_type: str
    floor: int
    capacity: int = Field(default=2, ge=1)
    status: RoomStatus = RoomStatus.AVAILABLE
    is_active: bool = True


class RoomCreate(RoomBase):
    pass


class RoomUpdate(BaseModel):
    room_name: str | None = None
    room_type: str | None = None
    floor: int | None = Field(default=None, ge=0)
    capacity: int | None = Field(default=None, ge=1)
    status: RoomStatus | None = None
    is_active: bool | None = None


class RoomRead(RoomBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
