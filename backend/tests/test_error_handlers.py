import pytest
from fastapi import Request

from app.api.error_handlers import domain_error_handler
from app.core.errors import (
    AuthorizationError,
    ConflictError,
    DomainError,
    NotFoundError,
    StateError,
    ValidationError,
)


@pytest.mark.parametrize(
    ("error", "expected_status"),
    [
        (ValidationError("invalid input"), 422),
        (NotFoundError("not found"), 404),
        (ConflictError("conflict"), 409),
        (StateError("invalid state"), 409),
        (AuthorizationError("forbidden"), 403),
        (DomainError("domain failure"), 409),
    ],
)
def test_domain_error_handler(
    error: DomainError,
    expected_status: int,
    http_request: Request,
) -> None:
    response = domain_error_handler(http_request, error)

    assert response.status_code == expected_status
    assert response.body == (f'{{"detail":"{error}"}}'.encode())


def test_domain_error_handler_integrates_with_fastapi() -> None:
    from fastapi import FastAPI
    from fastapi.testclient import TestClient

    from app.core.errors import ConflictError

    test_app = FastAPI()
    test_app.add_exception_handler(DomainError, domain_error_handler)

    @test_app.get("/test-error")
    def test_error() -> None:
        raise ConflictError("Conflict happened.")

    response = TestClient(test_app).get("/test-error")

    assert response.status_code == 409
    assert response.json() == {"detail": "Conflict happened."}
