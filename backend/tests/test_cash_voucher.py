from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy.orm import Session

from app.core.errors import StateError
from app.services.cash_voucher import CashVoucherService


def create_voucher(
    db_session: Session,
    *,
    amount: Decimal = Decimal("1250.00"),
):
    return CashVoucherService(db_session).create_voucher(
        voucher_date=date(2026, 9, 22),
        payee_name="Jaisalmer Supplies",
        expense_category="Supplies",
        description="Cleaning supplies",
        amount=amount,
        currency="INR",
        external_reference="BILL-1001",
        notes="Test voucher",
        created_by=1,
    )


def test_create_cash_voucher(db_session: Session) -> None:
    voucher = create_voucher(db_session)
    db_session.commit()

    assert voucher.voucher_number.startswith("CV-")
    assert voucher.payee_name == "Jaisalmer Supplies"
    assert voucher.expense_category == "Supplies"
    assert voucher.amount == Decimal("1250.00")
    assert voucher.currency == "INR"
    assert voucher.status == "active"


def test_list_cash_vouchers_can_filter_status(db_session: Session) -> None:
    active = create_voucher(db_session, amount=Decimal("800.00"))
    cancelled = create_voucher(db_session, amount=Decimal("400.00"))
    db_session.commit()

    CashVoucherService(db_session).cancel_voucher(cancelled.id, cancelled_by=1)
    db_session.commit()

    active_rows = CashVoucherService(db_session).list_vouchers("active")
    cancelled_rows = CashVoucherService(db_session).list_vouchers("cancelled")

    assert [row.id for row in active_rows] == [active.id]
    assert [row.id for row in cancelled_rows] == [cancelled.id]


def test_update_active_cash_voucher(db_session: Session) -> None:
    voucher = create_voucher(db_session)
    db_session.commit()

    updated = CashVoucherService(db_session).update_voucher(
        voucher.id,
        {
            "payee_name": "Updated Supplier",
            "expense_category": "Maintenance",
            "amount": Decimal("1400.00"),
        },
        updated_by=1,
    )
    db_session.commit()

    assert updated.payee_name == "Updated Supplier"
    assert updated.expense_category == "Maintenance"
    assert updated.amount == Decimal("1400.00")


def test_cancel_cash_voucher(db_session: Session) -> None:
    voucher = create_voucher(db_session)
    db_session.commit()

    cancelled = CashVoucherService(db_session).cancel_voucher(
        voucher.id,
        cancelled_by=1,
    )
    db_session.commit()

    assert cancelled.status == "cancelled"
    assert cancelled.cancelled_by == 1
    assert cancelled.cancelled_at is not None


def test_cancelled_voucher_cannot_be_cancelled_again(
    db_session: Session,
) -> None:
    voucher = create_voucher(db_session)
    db_session.commit()

    CashVoucherService(db_session).cancel_voucher(voucher.id, cancelled_by=1)
    db_session.commit()

    with pytest.raises(
        StateError,
        match="Only active cash vouchers can be cancelled.",
    ):
        CashVoucherService(db_session).cancel_voucher(
            voucher.id,
            cancelled_by=1,
        )


def test_cancelled_voucher_cannot_be_updated(db_session: Session) -> None:
    voucher = create_voucher(db_session)
    db_session.commit()

    CashVoucherService(db_session).cancel_voucher(voucher.id, cancelled_by=1)
    db_session.commit()

    with pytest.raises(
        StateError,
        match="Only active cash vouchers can be updated.",
    ):
        CashVoucherService(db_session).update_voucher(
            voucher.id,
            {"amount": Decimal("900.00")},
            updated_by=1,
        )
