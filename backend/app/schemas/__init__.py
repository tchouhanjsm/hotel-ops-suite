from app.schemas.auth import AuthenticatedStaff, LoginRequest, LoginResponse
from app.schemas.availability import AvailabilityRequest, AvailabilityResponse
from app.schemas.booking import (
    BookingBase,
    BookingCreate,
    BookingRead,
    BookingStatus,
    BookingUpdate,
)
from app.schemas.guest import GuestBase, GuestCreate, GuestRead, GuestUpdate
from app.schemas.room import RoomBase, RoomCreate, RoomRead, RoomStatus, RoomUpdate
from app.schemas.staff import StaffBase, StaffCreate, StaffRead, StaffUpdate

__all__ = [
    "AuthenticatedStaff",
    "AvailabilityRequest",
    "AvailabilityResponse",
    "BookingBase",
    "BookingCreate",
    "BookingRead",
    "BookingStatus",
    "BookingUpdate",
    "GuestBase",
    "GuestCreate",
    "GuestRead",
    "GuestUpdate",
    "LoginRequest",
    "LoginResponse",
    "RoomBase",
    "RoomCreate",
    "RoomRead",
    "RoomStatus",
    "RoomUpdate",
    "StaffBase",
    "StaffCreate",
    "StaffRead",
    "StaffUpdate",
]
