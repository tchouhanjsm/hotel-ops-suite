from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy.orm import Session

from app.core.errors import ConflictError, StateError
from app.services.booking import BookingService
from app.services.folio import FolioService
from app.services.invoice import InvoiceService


def create_folio(db_session: Session, booking_test_data):
    guest, room = booking_test_data

    booking = BookingService(db_session).create_booking(
        guest_id=guest.id,
        room_id=room.id,
        check_in=date(2027, 7, 10),
        check_out=date(2027, 7, 12),
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


def test_create_invoice_draft_snapshots_folio(
    db_session: Session,
    booking_test_data,
) -> None:
    folio = create_folio(db_session, booking_test_data)
    db_session.commit()

    invoice = InvoiceService(db_session).create_draft(
        folio_id=folio.id,
        notes="Guest copy",
    )
    db_session.commit()

    items = InvoiceService(db_session).list_items(invoice.id)

    assert invoice.status == "draft"
    assert invoice.invoice_number.startswith("INV-")
    assert invoice.bill_to_name == "Test Guest"
    assert invoice.booking_reference.startswith("BK-")
    assert invoice.room_number == "201"
    assert invoice.subtotal == Decimal("9800.00")
    assert invoice.tax_total == Decimal("490.00")
    assert invoice.grand_total == Decimal("10290.00")
    assert invoice.paid_amount == Decimal("0.00")
    assert invoice.balance_due == Decimal("10290.00")
    assert len(items) == 1


def test_get_invoice_by_folio_returns_active_invoice(
    db_session: Session,
    booking_test_data,
) -> None:
    folio = create_folio(db_session, booking_test_data)
    db_session.commit()

    invoice = InvoiceService(db_session).create_draft(
        folio_id=folio.id,
        notes=None,
    )
    db_session.commit()

    found = InvoiceService(db_session).get_invoice_by_folio(folio.id)

    assert found is not None
    assert found.id == invoice.id
    assert found.folio_id == folio.id


def test_get_invoice_by_folio_ignores_void_invoice(
    db_session: Session,
    booking_test_data,
) -> None:
    folio = create_folio(db_session, booking_test_data)
    db_session.commit()

    invoice = InvoiceService(db_session).create_draft(
        folio_id=folio.id,
        notes=None,
    )
    db_session.commit()

    InvoiceService(db_session).finalize_invoice(
        invoice_id=invoice.id,
        finalized_by=1,
    )
    db_session.commit()

    InvoiceService(db_session).void_invoice(invoice.id)
    db_session.commit()

    found = InvoiceService(db_session).get_invoice_by_folio(folio.id)

    assert found is None


def test_duplicate_active_invoice_rejected(
    db_session: Session,
    booking_test_data,
) -> None:
    folio = create_folio(db_session, booking_test_data)
    db_session.commit()

    InvoiceService(db_session).create_draft(
        folio_id=folio.id,
        notes=None,
    )
    db_session.commit()

    with pytest.raises(
        ConflictError,
        match="Invoice already exists for this folio.",
    ):
        InvoiceService(db_session).create_draft(
            folio_id=folio.id,
            notes=None,
        )


def test_finalize_invoice_refreshes_from_current_folio(
    db_session: Session,
    booking_test_data,
) -> None:
    folio = create_folio(db_session, booking_test_data)
    db_session.commit()

    invoice = InvoiceService(db_session).create_draft(
        folio_id=folio.id,
        notes=None,
    )
    db_session.commit()

    FolioService(db_session).add_item(
        folio_id=folio.id,
        item_type="food",
        description="Dinner",
        quantity=Decimal("1.00"),
        unit_price=Decimal("1000.00"),
        tax_percent=Decimal("5.00"),
    )
    db_session.commit()

    finalized = InvoiceService(db_session).finalize_invoice(
        invoice_id=invoice.id,
        finalized_by=1,
    )
    db_session.commit()

    assert finalized is not None
    assert finalized.status == "finalized"
    assert finalized.subtotal == Decimal("10800.00")
    assert finalized.tax_total == Decimal("540.00")
    assert finalized.grand_total == Decimal("11340.00")
    assert finalized.paid_amount == Decimal("0.00")
    assert finalized.balance_due == Decimal("11340.00")
    assert finalized.finalized_at is not None
    assert finalized.finalized_by == 1

    items = InvoiceService(db_session).list_items(invoice.id)
    assert len(items) == 2


def test_finalized_invoice_is_snapshot(
    db_session: Session,
    booking_test_data,
) -> None:
    folio = create_folio(db_session, booking_test_data)
    db_session.commit()

    invoice = InvoiceService(db_session).create_draft(
        folio_id=folio.id,
        notes=None,
    )
    db_session.commit()

    InvoiceService(db_session).finalize_invoice(
        invoice_id=invoice.id,
        finalized_by=1,
    )
    db_session.commit()

    FolioService(db_session).add_item(
        folio_id=folio.id,
        item_type="service",
        description="Airport transfer",
        quantity=Decimal("1.00"),
        unit_price=Decimal("500.00"),
        tax_percent=Decimal("5.00"),
    )
    db_session.commit()

    stored = InvoiceService(db_session).get_invoice(invoice.id)
    assert stored is not None
    assert stored.grand_total == Decimal("10290.00")

    items = InvoiceService(db_session).list_items(invoice.id)
    assert len(items) == 1


def test_finalize_twice_rejected(
    db_session: Session,
    booking_test_data,
) -> None:
    folio = create_folio(db_session, booking_test_data)
    db_session.commit()

    invoice = InvoiceService(db_session).create_draft(
        folio_id=folio.id,
        notes=None,
    )
    db_session.commit()

    InvoiceService(db_session).finalize_invoice(
        invoice_id=invoice.id,
        finalized_by=1,
    )
    db_session.commit()

    with pytest.raises(
        StateError,
        match="Invoice is already finalized.",
    ):
        InvoiceService(db_session).finalize_invoice(
            invoice_id=invoice.id,
            finalized_by=1,
        )


def test_void_finalized_invoice_allows_reissue(
    db_session: Session,
    booking_test_data,
) -> None:
    folio = create_folio(db_session, booking_test_data)
    db_session.commit()

    first = InvoiceService(db_session).create_draft(
        folio_id=folio.id,
        notes=None,
    )
    db_session.commit()

    InvoiceService(db_session).finalize_invoice(
        invoice_id=first.id,
        finalized_by=1,
    )
    db_session.commit()

    voided = InvoiceService(db_session).void_invoice(first.id)
    db_session.commit()

    assert voided is not None
    assert voided.status == "void"

    replacement = InvoiceService(db_session).create_draft(
        folio_id=folio.id,
        notes="Replacement invoice",
    )
    db_session.commit()

    assert replacement.id != first.id
    assert replacement.status == "draft"
    assert replacement.invoice_number != first.invoice_number


def test_void_draft_rejected(
    db_session: Session,
    booking_test_data,
) -> None:
    folio = create_folio(db_session, booking_test_data)
    db_session.commit()

    invoice = InvoiceService(db_session).create_draft(
        folio_id=folio.id,
        notes=None,
    )
    db_session.commit()

    with pytest.raises(
        StateError,
        match="Only finalized invoices can be voided.",
    ):
        InvoiceService(db_session).void_invoice(invoice.id)
