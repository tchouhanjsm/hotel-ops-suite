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
    },
    "manager": {
        "staff:read",
        "staff:create",
        "staff:update",
        "room:read",
        "room:create",
        "room:update",
    },
    "front_desk": {
        "staff:read",
        "room:read",
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
