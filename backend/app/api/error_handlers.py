from fastapi import Request
from fastapi.responses import JSONResponse

from app.core.errors import (
    AuthorizationError,
    ConflictError,
    DomainError,
    NotFoundError,
    StateError,
    ValidationError,
)

_ERROR_STATUS_CODES: dict[type[DomainError], int] = {
    ValidationError: 422,
    NotFoundError: 404,
    ConflictError: 409,
    StateError: 409,
    AuthorizationError: 403,
}


def domain_error_handler(
    _request: Request,
    exc: Exception,
) -> JSONResponse:
    if not isinstance(exc, DomainError):
        raise exc

    status_code = _ERROR_STATUS_CODES.get(type(exc), 409)

    return JSONResponse(
        status_code=status_code,
        content={"detail": str(exc)},
    )
