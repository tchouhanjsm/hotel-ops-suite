from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.core.audit import record_audit
from app.core.rbac import require_permission
from app.models.booking import Booking
from app.models.staff import Staff
from app.schemas.availability import AvailabilityResponse
from app.schemas.booking import BookingCreate, BookingRead, BookingUpdate
from app.services.booking import BookingService

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.get("", response_model=list[BookingRead])
def list_bookings(
    db: Session = Depends(get_db),  # noqa: B008
    _: Staff = Depends(require_permission("booking:read")),  # noqa: B008
) -> list[Booking]:
    return BookingService(db).list_bookings()


@router.get("/availability", response_model=AvailabilityResponse)
def check_availability(
    room_id: int = Query(gt=0),
    check_in: date = Query(),  # noqa: B008
    check_out: date = Query(),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
    _: Staff = Depends(require_permission("booking:read")),  # noqa: B008
) -> AvailabilityResponse:
    if check_out <= check_in:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Check-out must be after check-in.",
        )

    available = BookingService(db).is_room_available(
        room_id=room_id,
        check_in=check_in,
        check_out=check_out,
    )

    return AvailabilityResponse(
        room_id=room_id,
        available=available,
    )


@router.post(
    "",
    response_model=BookingRead,
    status_code=status.HTTP_201_CREATED,
)
def create_booking(
    data: BookingCreate,
    request: Request,
    db: Session = Depends(get_db),  # noqa: B008
    current_staff: Staff = Depends(require_permission("booking:create")),  # noqa: B008
) -> Booking:
    try:
        booking = BookingService(db).create_booking(
            guest_id=data.guest_id,
            room_id=data.room_id,
            check_in=data.check_in,
            check_out=data.check_out,
            rate=data.rate,
            source=data.source,
            notes=data.notes,
        )
        record_audit(
            db,
            request,
            current_staff,
            action="CREATE_BOOKING",
            entity_type="booking",
            entity_id=booking.id,
            details={
                "booking_reference": booking.booking_reference,
                "guest_id": booking.guest_id,
                "room_id": booking.room_id,
            },
        )
        db.commit()
        return booking
    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.patch(
    "/{booking_id}",
    response_model=BookingRead,
)
def update_booking(
    booking_id: int,
    data: BookingUpdate,
    request: Request,
    db: Session = Depends(get_db),  # noqa: B008
    current_staff: Staff = Depends(require_permission("booking:update")),  # noqa: B008
) -> Booking:
    try:
        booking = BookingService(db).update_booking(
            booking_id=booking_id,
            room_id=data.room_id,
            check_in=data.check_in,
            check_out=data.check_out,
            rate=data.rate,
            source=data.source,
            notes=data.notes,
        )

        if booking is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found.",
            )

        record_audit(
            db,
            request,
            current_staff,
            action="UPDATE_BOOKING",
            entity_type="booking",
            entity_id=booking.id,
            details={
                "booking_reference": booking.booking_reference,
                "room_id": booking.room_id,
                "check_in": booking.check_in.isoformat(),
                "check_out": booking.check_out.isoformat(),
            },
        )
        db.commit()
        return booking

    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.post(
    "/{booking_id}/cancel",
    response_model=BookingRead,
)
def cancel_booking(
    booking_id: int,
    request: Request,
    db: Session = Depends(get_db),  # noqa: B008
    current_staff: Staff = Depends(require_permission("booking:cancel")),  # noqa: B008
) -> Booking:
    try:
        booking = BookingService(db).cancel_booking(booking_id)
    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    if booking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found.",
        )

    record_audit(
        db,
        request,
        current_staff,
        action="CANCEL_BOOKING",
        entity_type="booking",
        entity_id=booking.id,
        details={"booking_reference": booking.booking_reference},
    )
    db.commit()
    return booking


@router.post(
    "/{booking_id}/check-in",
    response_model=BookingRead,
)
def check_in_booking(
    booking_id: int,
    request: Request,
    db: Session = Depends(get_db),  # noqa: B008
    current_staff: Staff = Depends(require_permission("booking:check_in")),  # noqa: B008
) -> Booking:
    try:
        booking = BookingService(db).check_in(booking_id)
    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    if booking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found.",
        )

    record_audit(
        db,
        request,
        current_staff,
        action="CHECK_IN",
        entity_type="booking",
        entity_id=booking.id,
        details={
            "booking_reference": booking.booking_reference,
            "room_id": booking.room_id,
        },
    )
    db.commit()
    return booking


@router.post(
    "/{booking_id}/check-out",
    response_model=BookingRead,
)
def check_out_booking(
    booking_id: int,
    request: Request,
    db: Session = Depends(get_db),  # noqa: B008
    current_staff: Staff = Depends(require_permission("booking:check_out")),  # noqa: B008
) -> Booking:
    try:
        booking = BookingService(db).check_out(booking_id)
    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    if booking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found.",
        )

    record_audit(
        db,
        request,
        current_staff,
        action="CHECK_OUT",
        entity_type="booking",
        entity_id=booking.id,
        details={
            "booking_reference": booking.booking_reference,
            "room_id": booking.room_id,
        },
    )
    db.commit()
    return booking


@router.get(
    "/{booking_id}",
    response_model=BookingRead,
)
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),  # noqa: B008
    _: Staff = Depends(require_permission("booking:read")),  # noqa: B008
) -> Booking:
    booking = BookingService(db).get_booking(booking_id)

    if booking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found.",
        )

    return booking
