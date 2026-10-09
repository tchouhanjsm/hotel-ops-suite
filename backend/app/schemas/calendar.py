from datetime import date

from pydantic import BaseModel, ConfigDict

from app.schemas.booking import BookingStatus


class CalendarEntryRead(BaseModel):
    booking_id: int
    booking_reference: str
    guest_id: int
    room_id: int
    check_in: date
    check_out: date
    status: BookingStatus

    model_config = ConfigDict(from_attributes=True)
