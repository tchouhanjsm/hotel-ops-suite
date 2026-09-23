from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy.orm import Session

from app.core.errors import ConflictError, StateError
from app.services.booking import BookingService
from app.services.folio import FolioService


def create_booking(db_session: Session, booking_test_data):
    guest, room = booking_test_data

    return BookingService(db_session).create_booking(
        guest_id=guest.id,
        room_id=room.id,
        check_in=date(2027, 5, 10),
        check_out=date(2027, 5, 12),
        rate=Decimal("4900.00"),
        source="direct",
        notes=None,
    )


def test_create_folio_generates_room_charge(
    db_session: Session,
    booking_test_data,
) -> None:
    booking = create_booking(db_session, booking_test_data)
    db_session.commit()

    folio = FolioService(db_session).create_folio(
        booking_id=booking.id,
        currency="INR",
        notes=None,
    )

    items = FolioService(db_session).list_items(folio.id)

    assert len(items) == 1
    assert items[0].item_type == "room_charge"
    assert items[0].quantity == Decimal("2.00")
    assert items[0].unit_price == Decimal("4900.00")
    assert items[0].amount == Decimal("9800.00")
    assert items[0].tax_amount == Decimal("490.00")
    assert items[0].total_amount == Decimal("10290.00")


def test_duplicate_folio_rejected(
    db_session: Session,
    booking_test_data,
) -> None:
    booking = create_booking(db_session, booking_test_data)
    db_session.commit()

    FolioService(db_session).create_folio(
        booking_id=booking.id,
        currency="INR",
        notes=None,
    )
    db_session.commit()

    with pytest.raises(
        ConflictError,
        match="Folio already exists for this booking.",
    ):
        FolioService(db_session).create_folio(
            booking_id=booking.id,
            currency="INR",
            notes=None,
        )


def test_add_folio_item_calculates_tax(
    db_session: Session,
    booking_test_data,
) -> None:
    booking = create_booking(db_session, booking_test_data)
    db_session.commit()

    folio = FolioService(db_session).create_folio(
        booking_id=booking.id,
        currency="INR",
        notes=None,
    )
    db_session.commit()

    item = FolioService(db_session).add_item(
        folio_id=folio.id,
        item_type="food",
        description="Dinner",
        quantity=Decimal("1.00"),
        unit_price=Decimal("1000.00"),
        tax_percent=Decimal("5.00"),
    )

    assert item.amount == Decimal("1000.00")
    assert item.tax_amount == Decimal("50.00")
    assert item.total_amount == Decimal("1050.00")


def test_folio_totals_include_all_items(
    db_session: Session,
    booking_test_data,
) -> None:
    booking = create_booking(db_session, booking_test_data)
    db_session.commit()

    folio = FolioService(db_session).create_folio(
        booking_id=booking.id,
        currency="INR",
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

    subtotal, tax_total, grand_total = FolioService(db_session).get_totals(folio.id)

    assert subtotal == Decimal("10800.00")
    assert tax_total == Decimal("540.00")
    assert grand_total == Decimal("11340.00")


def test_closed_folio_cannot_accept_items(
    db_session: Session,
    booking_test_data,
) -> None:
    booking = create_booking(db_session, booking_test_data)
    db_session.commit()

    folio = FolioService(db_session).create_folio(
        booking_id=booking.id,
        currency="INR",
        notes=None,
    )
    folio.status = "closed"
    db_session.commit()

    with pytest.raises(
        StateError,
        match="Folio is not open.",
    ):
        FolioService(db_session).add_item(
            folio_id=folio.id,
            item_type="food",
            description="Dinner",
            quantity=Decimal("1.00"),
            unit_price=Decimal("1000.00"),
            tax_percent=Decimal("5.00"),
        )


def test_cancelled_booking_cannot_create_folio(
    db_session: Session,
    booking_test_data,
) -> None:
    booking = create_booking(db_session, booking_test_data)
    db_session.commit()

    BookingService(db_session).cancel_booking(booking.id)
    db_session.commit()

    with pytest.raises(
        StateError,
        match="Cannot create a folio for a cancelled booking.",
    ):
        FolioService(db_session).create_folio(
            booking_id=booking.id,
            currency="INR",
            notes=None,
        )


def test_get_folio_by_booking(
    db_session: Session,
    booking_test_data,
) -> None:
    booking = create_booking(db_session, booking_test_data)
    db_session.commit()

    folio = FolioService(db_session).create_folio(
        booking_id=booking.id,
        currency="INR",
        notes=None,
    )

    found = FolioService(db_session).get_folio_by_booking(booking.id)

    assert found is not None
    assert found.id == folio.id
    assert found.booking_id == booking.id


def test_voided_folio_item_remains_in_history_but_is_excluded_from_totals(
    db_session: Session,
    booking_test_data,
) -> None:
    booking = create_booking(db_session, booking_test_data)
    db_session.commit()

    folio = FolioService(db_session).create_folio(
        booking_id=booking.id,
        currency="INR",
        notes=None,
    )

    food_item = FolioService(db_session).add_item(
        folio_id=folio.id,
        item_type="food",
        description="Dinner",
        quantity=Decimal("1.00"),
        unit_price=Decimal("1000.00"),
        tax_percent=Decimal("5.00"),
    )
    db_session.commit()

    voided = FolioService(db_session).void_item(
        food_item.id,
        voided_by=1,
    )

    assert voided.status == "voided"
    assert voided.voided_at is not None
    assert voided.voided_by == 1

    all_items = FolioService(db_session).list_items(folio.id)
    active_items = FolioService(db_session).list_active_items(folio.id)

    assert len(all_items) == 2
    assert len(active_items) == 1
    assert active_items[0].item_type == "room_charge"

    subtotal, tax_total, grand_total = FolioService(db_session).get_totals(
        folio.id
    )

    assert subtotal == Decimal("9800.00")
    assert tax_total == Decimal("490.00")
    assert grand_total == Decimal("10290.00")


def test_voided_folio_item_cannot_be_voided_twice(
    db_session: Session,
    booking_test_data,
) -> None:
    booking = create_booking(db_session, booking_test_data)
    db_session.commit()

    folio = FolioService(db_session).create_folio(
        booking_id=booking.id,
        currency="INR",
        notes=None,
    )

    item = FolioService(db_session).add_item(
        folio_id=folio.id,
        item_type="food",
        description="Dinner",
        quantity=Decimal("1.00"),
        unit_price=Decimal("1000.00"),
        tax_percent=Decimal("5.00"),
    )
    db_session.commit()

    FolioService(db_session).void_item(item.id, voided_by=1)
    db_session.commit()

    with pytest.raises(
        StateError,
        match="Folio item is already voided.",
    ):
        FolioService(db_session).void_item(item.id, voided_by=1)
