from datetime import datetime

from pydantic import BaseModel, ConfigDict


class StaffBase(BaseModel):
    username: str
    full_name: str
    role: str
    is_active: bool = True


class StaffCreate(StaffBase):
    password: str


class StaffUpdate(BaseModel):
    full_name: str | None = None
    role: str | None = None
    is_active: bool | None = None


class StaffRead(StaffBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
