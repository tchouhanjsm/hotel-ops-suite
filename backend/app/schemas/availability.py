from datetime import date

from pydantic import BaseModel, Field, model_validator


class AvailabilityRequest(BaseModel):
    room_id: int = Field(gt=0)
    check_in: date
    check_out: date

    @model_validator(mode="after")
    def validate_dates(self):
        if self.check_out <= self.check_in:
            raise ValueError("Check-out must be after check-in.")
        return self


class AvailabilityResponse(BaseModel):
    room_id: int
    available: bool
