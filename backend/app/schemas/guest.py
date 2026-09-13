from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class GuestBase(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=5, max_length=30)
    email: EmailStr | None = None
    address: str | None = None
    city: str | None = None
    country: str | None = None
    id_type: str | None = None
    id_number: str | None = None
    notes: str | None = None
    is_active: bool = True


class GuestCreate(GuestBase):
    pass


class GuestUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    phone: str | None = Field(default=None, min_length=5, max_length=30)
    email: EmailStr | None = None
    address: str | None = None
    city: str | None = None
    country: str | None = None
    id_type: str | None = None
    id_number: str | None = None
    notes: str | None = None
    is_active: bool | None = None


class GuestRead(GuestBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
