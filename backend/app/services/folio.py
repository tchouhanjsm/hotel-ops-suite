from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import ConflictError, NotFoundError, StateError
from app.core.identifiers import generate_reference
from app.core.money import (
    ZERO_MONEY,
    calculate_balance,
    calculate_line_amount,
    calculate_tax,
    calculate_total,
    to_money,
)
from app.models.booking import Booking
from app.models.folio import Folio, FolioItem
from app.repositories.booking import BookingRepository
from app.repositories.folio import FolioRepository
from app.repositories.payment import PaymentRepository


class FolioService:
    def __init__(self, db: Session) -> None:
        self.repository = FolioRepository(db)
        self.booking_repository = BookingRepository(db)
        self.payment_repository = PaymentRepository(db)

    def _generate_folio_number(self) -> str:
        while True:
            number = generate_reference("FOL")
            if self.repository.get_by_number(number) is None:
                return number

    def get_folio(self, folio_id: int) -> Folio | None:
        return self.repository.get_by_id(folio_id)

    def get_folio_by_booking(self, booking_id: int) -> Folio | None:
        return self.repository.get_by_booking_id(booking_id)

    def list_items(self, folio_id: int) -> list[FolioItem]:
        return self.repository.list_items(folio_id)

    def list_active_items(self, folio_id: int) -> list[FolioItem]:
        return self.repository.list_active_items(folio_id)

    def get_totals(self, folio_id: int) -> tuple[Decimal, Decimal, Decimal]:
        items = self.repository.list_active_items(folio_id)

        subtotal = to_money(
            sum(
                (item.amount for item in items),
                ZERO_MONEY,
            )
        )
        tax_total = to_money(
            sum(
                (item.tax_amount for item in items),
                ZERO_MONEY,
            )
        )
        grand_total = calculate_total(subtotal, tax_total)

        return subtotal, tax_total, grand_total

    def get_balance(self, folio_id: int) -> tuple[Decimal, Decimal]:
        folio = self.repository.get_by_id(folio_id)

        if folio is None:
            raise NotFoundError("Folio not found.")

        _, _, grand_total = self.get_totals(folio_id)

        payments = self.payment_repository.list_by_folio(folio_id)

        paid_amount = to_money(
            sum(
                (
                    payment.amount
                    for payment in payments
                    if payment.status == "completed"
                ),
                ZERO_MONEY,
            )
        )

        balance_due = calculate_balance(
            grand_total,
            paid_amount,
        )

        return paid_amount, balance_due

    def create_folio(
        self,
        booking_id: int,
        currency: str,
        notes: str | None,
    ) -> Folio:
        booking = self.booking_repository.get_by_id(booking_id)

        if booking is None:
            raise NotFoundError("Booking not found.")

        if booking.status == "cancelled":
            raise StateError("Cannot create a folio for a cancelled booking.")

        if self.repository.get_by_booking_id(booking_id) is not None:
            raise ConflictError("Folio already exists for this booking.")

        folio = self.repository.create_folio(
            folio_number=self._generate_folio_number(),
            booking_id=booking_id,
            currency=currency.upper(),
            notes=notes,
        )

        self.add_room_charge(folio.id, booking)

        return folio

    def add_item(
        self,
        folio_id: int,
        item_type: str,
        description: str,
        quantity: Decimal,
        unit_price: Decimal,
        tax_percent: Decimal,
    ) -> FolioItem:
        folio = self.repository.get_by_id(folio_id)

        if folio is None:
            raise NotFoundError("Folio not found.")

        if folio.status != "open":
            raise StateError("Folio is not open.")

        amount = calculate_line_amount(quantity, unit_price)
        tax_amount = calculate_tax(amount, tax_percent)
        total_amount = calculate_total(amount, tax_amount)

        return self.repository.create_item(
            folio_id=folio_id,
            item_type=item_type,
            description=description,
            quantity=quantity,
            unit_price=unit_price,
            tax_percent=tax_percent,
            amount=amount,
            tax_amount=tax_amount,
            total_amount=total_amount,
        )

    def add_room_charge(
        self,
        folio_id: int,
        booking: Booking,
    ) -> FolioItem:
        items = self.repository.list_items(folio_id)

        if any(item.item_type == "room_charge" for item in items):
            raise ConflictError("Room charge already exists for this folio.")

        return self.add_item(
            folio_id=folio_id,
            item_type="room_charge",
            description=f"Room {booking.room_id} - {booking.nights} night(s)",
            quantity=Decimal(str(booking.nights)),
            unit_price=booking.rate,
            tax_percent=settings.gst_percent,
        )

    def create_folio_summary(self, folio_id: int) -> dict[str, object]:
        folio = self.repository.get_by_id(folio_id)

        if folio is None:
            raise NotFoundError("Folio not found.")

        subtotal, tax_total, grand_total = self.get_totals(folio_id)

        return {
            "folio": folio,
            "subtotal": subtotal,
            "tax_total": tax_total,
            "grand_total": grand_total,
        }


    def void_item(self, folio_item_id: int, voided_by: int) -> FolioItem:
        item = self.repository.get_item_by_id(folio_item_id)

        if item is None:
            raise NotFoundError("Folio item not found.")

        folio = self.repository.get_by_id(item.folio_id)

        if folio is None:
            raise NotFoundError("Folio not found.")

        if folio.status != "open":
            raise StateError("Folio is not open.")

        if item.status != "active":
            raise StateError("Folio item is already voided.")

        return self.repository.void_item(item, voided_by)
