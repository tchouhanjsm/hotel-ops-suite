from datetime import date
from decimal import Decimal

import pytest

from app.core.dates import DateRange, validate_date_range
from app.core.errors import (
    AuthorizationError,
    ConflictError,
    DomainError,
    NotFoundError,
    StateError,
    ValidationError,
)
from app.core.identifiers import generate_reference
from app.core.money import (
    ZERO_MONEY,
    calculate_balance,
    calculate_line_amount,
    calculate_tax,
    calculate_total,
    to_money,
)
from app.core.pagination import PaginationParams


def test_generate_reference() -> None:
    reference = generate_reference("BK")

    assert reference.startswith("BK-")
    assert len(reference) == 11


def test_generate_reference_rejects_invalid_prefix() -> None:
    with pytest.raises(ValueError, match="Invalid reference prefix."):
        generate_reference("booking-reference")


def test_money_rounding() -> None:
    assert to_money("100.005") == Decimal("100.01")
    assert calculate_line_amount(
        Decimal("2"),
        Decimal("99.995"),
    ) == Decimal("199.99")
    assert calculate_line_amount(
        Decimal("1"),
        Decimal("99.995"),
    ) == Decimal("100.00")


def test_money_calculations() -> None:
    amount = calculate_line_amount(
        Decimal("2"),
        Decimal("4900.00"),
    )
    tax = calculate_tax(
        amount,
        Decimal("5.00"),
    )

    assert amount == Decimal("9800.00")
    assert tax == Decimal("490.00")
    assert calculate_total(amount, tax) == Decimal("10290.00")
    assert calculate_balance(
        Decimal("10290.00"),
        Decimal("5000.00"),
    ) == Decimal("5290.00")


def test_balance_never_goes_negative() -> None:
    assert (
        calculate_balance(
            Decimal("100.00"),
            Decimal("150.00"),
        )
        == ZERO_MONEY
    )


def test_date_range() -> None:
    date_range = validate_date_range(
        date(2027, 7, 10),
        date(2027, 7, 12),
    )

    assert isinstance(date_range, DateRange)
    assert date_range.nights == 2


def test_invalid_date_range_rejected() -> None:
    with pytest.raises(
        ValueError,
        match="End date must be after start date.",
    ):
        validate_date_range(
            date(2027, 7, 12),
            date(2027, 7, 12),
        )


def test_pagination() -> None:
    params = PaginationParams(page=3, page_size=25)

    assert params.offset == 50


def test_invalid_pagination_rejected() -> None:
    with pytest.raises(
        ValueError,
        match="Page must be at least 1.",
    ):
        PaginationParams(page=0)


@pytest.mark.parametrize(
    "error_type",
    [
        ValidationError,
        NotFoundError,
        ConflictError,
        StateError,
        AuthorizationError,
    ],
)
def test_domain_errors_share_common_base(error_type) -> None:
    assert issubclass(error_type, DomainError)
