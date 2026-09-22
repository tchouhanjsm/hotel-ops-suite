from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy.orm import Session

from app.core.errors import StateError
from app.services.booking import BookingService
from app.services.folio import FolioService
from app.services.service_voucher import ServiceVoucherService


def create_folio(db_session: Session, booking_test_data) -> int:
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

    folio = FolioService(db_session).create_folio(
        booking_id=booking.id,
        currency="INR",
        notes=None,
    )
    db_session.commit()
    return folio.id


def create_voucher(db_session: Session, booking_test_data):
    folio_id = create_folio(db_session, booking_test_data)

    return ServiceVoucherService(db_session).create_voucher(
        voucher_date=date(2027, 6, 10),
        folio_id=folio_id,
        service_category="Tours",
        service_name="Desert Safari",
        description="Evening camel safari",
        quantity=Decimal("2.00"),
        unit_price=Decimal("850.00"),
        tax_percent=Decimal("5.00"),
        notes="Guest requested sunset departure",
        created_by=1,
    )


def test_create_service_voucher(
    db_session: Session,
    booking_test_data,
) -> None:
    voucher = create_voucher(db_session, booking_test_data)

    assert voucher.voucher_number.startswith("SV-")
    assert voucher.status == "draft"
    assert voucher.currency == "INR"
    assert voucher.amount == Decimal("1700.00")
    assert voucher.tax_amount == Decimal("85.00")
    assert voucher.total_amount == Decimal("1785.00")
    assert voucher.folio_item_id is None


def test_update_draft_service_voucher(
    db_session: Session,
    booking_test_data,
) -> None:
    voucher = create_voucher(db_session, booking_test_data)

    updated = ServiceVoucherService(db_session).update_voucher(
        voucher.id,
        {
            "quantity": Decimal("3.00"),
            "unit_price": Decimal("900.00"),
        },
    )

    assert updated.quantity == Decimal("3.00")
    assert updated.amount == Decimal("2700.00")
    assert updated.tax_amount == Decimal("135.00")
    assert updated.total_amount == Decimal("2835.00")


def test_issue_service_voucher_creates_one_folio_item(
    db_session: Session,
    booking_test_data,
) -> None:
    voucher = create_voucher(db_session, booking_test_data)

    issued = ServiceVoucherService(db_session).issue_voucher(
        voucher.id,
        issued_by=1,
    )

    items = FolioService(db_session).list_items(issued.folio_id)

    assert issued.status == "issued"
    assert issued.folio_item_id is not None
    service_items = [item for item in items if item.item_type == "service"]
    assert len(service_items) == 1
    assert service_items[0].id == issued.folio_item_id
    assert service_items[0].total_amount == Decimal("1785.00")


def test_issued_service_voucher_cannot_be_updated(
    db_session: Session,
    booking_test_data,
) -> None:
    voucher = create_voucher(db_session, booking_test_data)
    ServiceVoucherService(db_session).issue_voucher(voucher.id, issued_by=1)

    with pytest.raises(
        StateError,
        match="Only draft service vouchers can be updated.",
    ):
        ServiceVoucherService(db_session).update_voucher(
            voucher.id,
            {"unit_price": Decimal("1000.00")},
        )


def test_issued_service_voucher_cannot_be_cancelled(
    db_session: Session,
    booking_test_data,
) -> None:
    voucher = create_voucher(db_session, booking_test_data)
    ServiceVoucherService(db_session).issue_voucher(voucher.id, issued_by=1)

    with pytest.raises(
        StateError,
        match="Only draft service vouchers can be cancelled.",
    ):
        ServiceVoucherService(db_session).cancel_voucher(
            voucher.id,
            cancelled_by=1,
        )
