from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, model_validator


class BookingStatus(StrEnum):
    CONFIRMED = "confirmed"
    CHECKED_IN = "checked_in"
    CHECKED_OUT = "checked_out"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class BookingBase(BaseModel):
    guest_id: int = Field(gt=0)
    room_id: int = Field(gt=0)
    check_in: date
    check_out: date
    rate: Decimal = Field(gt=0, decimal_places=2)
    source: str = Field(default="direct", min_length=1, max_length=50)
    notes: str | None = None

    @model_validator(mode="after")
    def validate_dates(self):
        if self.check_out <= self.check_in:
            raise ValueError("Check-out must be after check-in.")
        return self


class BookingCreate(BookingBase):
    pass


class BookingUpdate(BaseModel):
    room_id: int | None = Field(default=None, gt=0)
    check_in: date | None = None
    check_out: date | None = None
    rate: Decimal | None = Field(default=None, gt=0, decimal_places=2)
    source: str | None = Field(default=None, min_length=1, max_length=50)
    notes: str | None = None
    status: BookingStatus | None = None

    @model_validator(mode="after")
    def validate_dates(self):
        if (
            self.check_in is not None
            and self.check_out is not None
            and self.check_out <= self.check_in
        ):
            raise ValueError("Check-out must be after check-in.")
        return self


class BookingRead(BookingBase):
    id: int
    booking_reference: str
    nights: int
    status: BookingStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
