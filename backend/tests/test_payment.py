from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy.orm import Session

from app.core.errors import ConflictError, StateError
from app.services.booking import BookingService
from app.services.folio import FolioService
from app.services.payment import PaymentService


def create_folio(db_session: Session, booking_test_data):
    guest, room = booking_test_data

    booking = BookingService(db_session).create_booking(
        guest_id=guest.id,
        room_id=room.id,
        check_in=date(2027, 6, 10),
        check_out=date(2027, 6, 12),
        rate=Decimal("4900.00"),
        source="direct",
        notes=None,
    )
    db_session.commit()

    return FolioService(db_session).create_folio(
        booking_id=booking.id,
        currency="INR",
        notes=None,
    )


def test_create_payment(
    db_session: Session,
    booking_test_data,
) -> None:
    folio = create_folio(db_session, booking_test_data)
    db_session.commit()

    payment = PaymentService(db_session).create_payment(
        folio_id=folio.id,
        amount=Decimal("5000.00"),
        payment_method="cash",
        received_by=1,
        external_reference=None,
        notes=None,
    )

    assert payment.payment_reference.startswith("PAY-")
    assert payment.amount == Decimal("5000.00")
    assert payment.status == "completed"


def test_payment_reduces_balance(
    db_session: Session,
    booking_test_data,
) -> None:
    folio = create_folio(db_session, booking_test_data)
    db_session.commit()

    PaymentService(db_session).create_payment(
        folio_id=folio.id,
        amount=Decimal("5000.00"),
        payment_method="upi",
        received_by=1,
        external_reference="UPI-123",
        notes=None,
    )
    db_session.commit()

    paid_amount, balance_due = FolioService(db_session).get_balance(folio.id)

    assert paid_amount == Decimal("5000.00")
    assert balance_due == Decimal("5290.00")


def test_overpayment_rejected(
    db_session: Session,
    booking_test_data,
) -> None:
    folio = create_folio(db_session, booking_test_data)
    db_session.commit()

    with pytest.raises(
        ConflictError,
        match="Payment exceeds outstanding balance.",
    ):
        PaymentService(db_session).create_payment(
            folio_id=folio.id,
            amount=Decimal("20000.00"),
            payment_method="cash",
            received_by=1,
            external_reference=None,
            notes=None,
        )


def test_void_payment_removes_it_from_balance(
    db_session: Session,
    booking_test_data,
) -> None:
    folio = create_folio(db_session, booking_test_data)
    db_session.commit()

    payment = PaymentService(db_session).create_payment(
        folio_id=folio.id,
        amount=Decimal("5000.00"),
        payment_method="card",
        received_by=1,
        external_reference="CARD-123",
        notes=None,
    )
    db_session.commit()

    PaymentService(db_session).void_payment(payment.id)
    db_session.commit()

    paid_amount, balance_due = FolioService(db_session).get_balance(folio.id)

    assert paid_amount == Decimal("0.00")
    assert balance_due == Decimal("10290.00")


def test_voided_payment_cannot_be_voided_again(
    db_session: Session,
    booking_test_data,
) -> None:
    folio = create_folio(db_session, booking_test_data)
    db_session.commit()

    payment = PaymentService(db_session).create_payment(
        folio_id=folio.id,
        amount=Decimal("5000.00"),
        payment_method="cash",
        received_by=1,
        external_reference=None,
        notes=None,
    )
    db_session.commit()

    PaymentService(db_session).void_payment(payment.id)
    db_session.commit()

    with pytest.raises(
        StateError,
        match="Only completed payments can be voided.",
    ):
        PaymentService(db_session).void_payment(payment.id)
