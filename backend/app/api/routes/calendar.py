from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi import status as http_status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.core.rbac import require_permission
from app.models.staff import Staff
from app.repositories.booking_calendar import BookingCalendarRepository
from app.schemas.booking import BookingStatus
from app.schemas.calendar import CalendarEntryRead

router = APIRouter(prefix="/calendar", tags=["Calendar"])


@router.get("", response_model=list[CalendarEntryRead])
def list_calendar(
    start_date: date = Query(),  # noqa: B008
    end_date: date = Query(),  # noqa: B008
    room_id: int | None = Query(default=None, gt=0),  # noqa: B008
    status: BookingStatus | None = Query(default=None),  # noqa: B008
    db: Session = Depends(get_db),  # noqa: B008
    _: Staff = Depends(require_permission("booking:read")),  # noqa: B008
) -> list[CalendarEntryRead]:
    if end_date <= start_date:
        raise HTTPException(
            status_code=http_status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="End date must be after start date.",
        )

    entries = BookingCalendarRepository(db).list_entries(
        start_date=start_date,
        end_date=end_date,
        room_id=room_id,
        status=status.value if status is not None else None,
    )

    return [CalendarEntryRead.model_validate(entry) for entry in entries]
