from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.core.rbac import require_permission
from app.models.guest import Guest
from app.models.staff import Staff
from app.schemas.guest import GuestCreate, GuestRead, GuestUpdate
from app.services.guest import GuestService

router = APIRouter(prefix="/guests", tags=["Guests"])


@router.get("", response_model=list[GuestRead])
def list_guests(
    query: str | None = Query(default=None, min_length=2),
    db: Session = Depends(get_db),  # noqa: B008
    _: Staff = Depends(require_permission("guest:read")),  # noqa: B008
) -> list[Guest]:
    service = GuestService(db)

    if query is not None:
        return service.search_guests(query)

    return service.list_guests()


@router.post(
    "",
    response_model=GuestRead,
    status_code=status.HTTP_201_CREATED,
)
def create_guest(
    data: GuestCreate,
    db: Session = Depends(get_db),  # noqa: B008
    _: Staff = Depends(require_permission("guest:create")),  # noqa: B008
) -> Guest:
    guest = GuestService(db).create_guest(
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
        email=str(data.email) if data.email is not None else None,
        address=data.address,
        city=data.city,
        country=data.country,
        id_type=data.id_type,
        id_number=data.id_number,
        notes=data.notes,
    )

    db.commit()
    return guest


@router.get(
    "/{guest_id}",
    response_model=GuestRead,
)
def get_guest(
    guest_id: int,
    db: Session = Depends(get_db),  # noqa: B008
    _: Staff = Depends(require_permission("guest:read")),  # noqa: B008
) -> Guest:
    guest = GuestService(db).get_guest(guest_id)

    if guest is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guest not found.",
        )

    return guest


@router.patch(
    "/{guest_id}",
    response_model=GuestRead,
)
def update_guest(
    guest_id: int,
    data: GuestUpdate,
    db: Session = Depends(get_db),  # noqa: B008
    _: Staff = Depends(require_permission("guest:update")),  # noqa: B008
) -> Guest:
    guest = GuestService(db).update_guest(
        guest_id=guest_id,
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
        email=str(data.email) if data.email is not None else None,
        address=data.address,
        city=data.city,
        country=data.country,
        id_type=data.id_type,
        id_number=data.id_number,
        notes=data.notes,
        is_active=data.is_active,
    )

    if guest is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guest not found.",
        )

    db.commit()
    return guest
