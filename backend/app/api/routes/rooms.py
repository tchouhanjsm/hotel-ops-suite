from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.core.rbac import require_permission
from app.models.room import Room
from app.models.staff import Staff
from app.schemas.room import RoomCreate, RoomRead, RoomUpdate
from app.services.room import RoomService

router = APIRouter(prefix="/rooms", tags=["Rooms"])


@router.get("", response_model=list[RoomRead])
def list_rooms(
    db: Session = Depends(get_db),  # noqa: B008
    _: Staff = Depends(require_permission("room:read")),  # noqa: B008
) -> list[Room]:
    return RoomService(db).list_rooms()


@router.post(
    "",
    response_model=RoomRead,
    status_code=status.HTTP_201_CREATED,
)
def create_room(
    data: RoomCreate,
    db: Session = Depends(get_db),  # noqa: B008
    _: Staff = Depends(require_permission("room:create")),  # noqa: B008
) -> Room:
    try:
        room = RoomService(db).create_room(
            room_number=data.room_number,
            room_name=data.room_name,
            room_type=data.room_type,
            floor=data.floor,
            capacity=data.capacity,
            status=data.status.value,
        )
        db.commit()
        return room
    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.get(
    "/{room_id}",
    response_model=RoomRead,
)
def get_room(
    room_id: int,
    db: Session = Depends(get_db),  # noqa: B008
    _: Staff = Depends(require_permission("room:read")),  # noqa: B008
) -> Room:
    room = RoomService(db).get_room(room_id)

    if room is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found.",
        )

    return room


@router.patch(
    "/{room_id}",
    response_model=RoomRead,
)
def update_room(
    room_id: int,
    data: RoomUpdate,
    db: Session = Depends(get_db),  # noqa: B008
    _: Staff = Depends(require_permission("room:update")),  # noqa: B008
) -> Room:
    try:
        room = RoomService(db).update_room(
            room_id=room_id,
            room_name=data.room_name,
            room_type=data.room_type,
            floor=data.floor,
            capacity=data.capacity,
            status=data.status.value if data.status is not None else None,
            is_active=data.is_active,
        )
    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc

    if room is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found.",
        )

    db.commit()
    return room
