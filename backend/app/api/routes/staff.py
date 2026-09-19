from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_staff
from app.api.dependencies import get_db
from app.core.audit import record_audit
from app.core.rbac import require_permission
from app.models.staff import Staff
from app.schemas.staff import StaffCreate, StaffRead, StaffUpdate
from app.services.staff import StaffService

router = APIRouter(prefix="/staff", tags=["Staff"])


@router.get("/me")
def get_current_staff_profile(
    staff: Staff = Depends(get_current_staff),  # noqa: B008
) -> dict[str, object]:
    return {
        "id": staff.id,
        "username": staff.username,
        "full_name": staff.full_name,
        "role": staff.role,
    }


@router.get("/protected")
def protected_staff_route(
    staff: Staff = Depends(require_permission("staff:read")),  # noqa: B008
) -> dict[str, object]:
    return {
        "message": "Permission granted.",
        "staff_id": staff.id,
    }


@router.get(
    "",
    response_model=list[StaffRead],
)
def list_staff(
    db: Session = Depends(get_db),  # noqa: B008
    _: Staff = Depends(require_permission("staff:read")),  # noqa: B008
) -> list[Staff]:
    return StaffService(db).list_staff()


@router.post(
    "",
    response_model=StaffRead,
    status_code=status.HTTP_201_CREATED,
)
def create_staff(
    data: StaffCreate,
    request: Request,
    db: Session = Depends(get_db),  # noqa: B008
    current_staff: Staff = Depends(require_permission("staff:create")),  # noqa: B008
) -> Staff:
    staff = StaffService(db).create_staff(
        username=data.username,
        password=data.password,
        full_name=data.full_name,
        role=data.role,
    )
    record_audit(
        db,
        request,
        current_staff,
        action="CREATE_STAFF",
        entity_type="staff",
        entity_id=staff.id,
        details={
            "username": staff.username,
            "role": staff.role,
        },
    )
    db.commit()
    return staff
@router.patch(
    "/{staff_id}",
    response_model=StaffRead,
)
def update_staff(
    staff_id: int,
    data: StaffUpdate,
    request: Request,
    db: Session = Depends(get_db),  # noqa: B008
    current_staff: Staff = Depends(require_permission("staff:update")),  # noqa: B008
) -> Staff:
    staff = StaffService(db).update_staff(
        staff_id=staff_id,
        full_name=data.full_name,
        role=data.role,
        is_active=data.is_active,
    )

    if staff is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found.",
        )

    record_audit(
        db,
        request,
        current_staff,
        action="UPDATE_STAFF",
        entity_type="staff",
        entity_id=staff.id,
        details={
            "username": staff.username,
            "role": staff.role,
            "is_active": staff.is_active,
        },
    )
    record_audit(
        db,
        request,
        current_staff,
        action="DEACTIVATE_STAFF",
        entity_type="staff",
        entity_id=staff.id,
        details={"username": staff.username},
    )
    db.commit()
    return staff


@router.post(
    "/{staff_id}/deactivate",
    response_model=StaffRead,
)
def deactivate_staff(
    staff_id: int,
    request: Request,
    db: Session = Depends(get_db),  # noqa: B008
    current_staff: Staff = Depends(require_permission("staff:update")),  # noqa: B008
) -> Staff:
    staff = StaffService(db).update_staff(
        staff_id=staff_id,
        is_active=False,
    )

    if staff is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found.",
        )

    db.commit()
    return staff


@router.get(
    "/{staff_id}",
    response_model=StaffRead,
)
def get_staff(
    staff_id: int,
    db: Session = Depends(get_db),  # noqa: B008
    _: Staff = Depends(require_permission("staff:read")),  # noqa: B008
) -> Staff:
    staff = StaffService(db).get_staff(staff_id)

    if staff is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found.",
        )

    return staff
