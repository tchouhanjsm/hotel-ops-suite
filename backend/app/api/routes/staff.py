from fastapi import APIRouter, Depends

from app.api.auth import get_current_staff
from app.core.rbac import require_permission
from app.models.staff import Staff

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
