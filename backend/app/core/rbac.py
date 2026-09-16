from collections.abc import Callable

from fastapi import Depends, HTTPException, status

from app.api.auth import get_current_staff
from app.models.staff import Staff

ROLE_PERMISSIONS: dict[str, set[str]] = {
    "admin": {
        "staff:read",
        "staff:create",
        "staff:update",
        "staff:delete",
        "room:read",
        "room:create",
        "room:update",
        "room:delete",
        "guest:read",
        "guest:create",
        "guest:update",
        "booking:read",
        "booking:create",
        "booking:update",
        "booking:cancel",
        "booking:check_in",
        "booking:check_out",
        "payment:read",
        "payment:create",
        "payment:void",
    },
    "manager": {
        "staff:read",
        "staff:create",
        "staff:update",
        "room:read",
        "room:create",
        "room:update",
        "guest:read",
        "guest:create",
        "guest:update",
        "booking:read",
        "booking:create",
        "booking:update",
        "booking:cancel",
        "booking:check_in",
        "booking:check_out",
        "payment:read",
        "payment:create",
        "payment:void",
    },
    "front_desk": {
        "staff:read",
        "room:read",
        "guest:read",
        "guest:create",
        "guest:update",
        "booking:read",
        "booking:create",
        "booking:update",
        "booking:cancel",
        "booking:check_in",
        "booking:check_out",
        "payment:read",
        "payment:create",
        "payment:void",
    },
}


def require_permission(permission: str) -> Callable[..., Staff]:
    def dependency(
        staff: Staff = Depends(get_current_staff),  # noqa: B008
    ) -> Staff:
        permissions = ROLE_PERMISSIONS.get(staff.role, set())

        if permission not in permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions.",
            )

        return staff

    return dependency
