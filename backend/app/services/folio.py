import secrets
from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.folio import Folio, FolioItem
from app.repositories.booking import BookingRepository
from app.repositories.folio import FolioRepository


class FolioService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = FolioRepository(db)
        self.booking_repository = BookingRepository(db)

    def _generate_folio_number(self) -> str:
        while True:
            number = f"FOL-{secrets.token_hex(4).upper()}"
            statement = select(Folio).where(Folio.folio_number == number)
            if self.db.scalar(statement) is None:
                return number

    def get_folio(self, folio_id: int) -> Folio | None:
        return self.repository.get_by_id(folio_id)

    def get_folio_by_booking(self, booking_id: int) -> Folio | None:
        return self.repository.get_by_booking_id(booking_id)

    def list_items(self, folio_id: int) -> list[FolioItem]:
        return self.repository.list_items(folio_id)

    def get_totals(self, folio_id: int) -> tuple[Decimal, Decimal, Decimal]:
        items = self.repository.list_items(folio_id)

        subtotal = sum(
            (item.amount for item in items),
            Decimal("0.00"),
        )
        tax_total = sum(
            (item.tax_amount for item in items),
            Decimal("0.00"),
        )
        grand_total = subtotal + tax_total

        return (
            subtotal.quantize(Decimal("0.01")),
            tax_total.quantize(Decimal("0.01")),
            grand_total.quantize(Decimal("0.01")),
        )

    def create_folio(
        self,
        booking_id: int,
        currency: str,
        notes: str | None,
    ) -> Folio:
        booking = self.booking_repository.get_by_id(booking_id)

        if booking is None:
            raise ValueError("Booking not found.")

        if booking.status == "cancelled":
            raise ValueError("Cannot create a folio for a cancelled booking.")

        if self.repository.get_by_booking_id(booking_id) is not None:
            raise ValueError("Folio already exists for this booking.")

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
            raise ValueError("Folio not found.")

        if folio.status != "open":
            raise ValueError("Folio is not open.")

        amount = (quantity * unit_price).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP,
        )

        tax_amount = (amount * tax_percent / Decimal("100")).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP,
        )

        total_amount = amount + tax_amount

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
            raise ValueError("Room charge already exists for this folio.")

        return self.add_item(
            folio_id=folio_id,
            item_type="room_charge",
            description=f"Room {booking.room_id} - {booking.nights} night(s)",
            quantity=Decimal(str(booking.nights)),
            unit_price=booking.rate,
            tax_percent=Decimal("5.00"),
        )

    def create_folio_summary(self, folio_id: int) -> dict[str, object]:
        folio = self.repository.get_by_id(folio_id)

        if folio is None:
            raise ValueError("Folio not found.")

        subtotal, tax_total, grand_total = self.get_totals(folio_id)

        return {
            "folio": folio,
            "subtotal": subtotal,
            "tax_total": tax_total,
            "grand_total": grand_total,
        }
