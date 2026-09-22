from datetime import UTC, datetime

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.errors import ConflictError, NotFoundError, StateError
from app.core.identifiers import generate_reference
from app.core.money import ZERO_MONEY
from app.models.booking import Booking
from app.models.folio import Folio
from app.models.guest import Guest
from app.models.invoice import Invoice, InvoiceItem
from app.models.room import Room
from app.repositories.booking import BookingRepository
from app.repositories.guest import GuestRepository
from app.repositories.invoice import InvoiceRepository
from app.repositories.room import RoomRepository
from app.services.folio import FolioService


class InvoiceService:
    def __init__(self, db: Session) -> None:
        self.repository = InvoiceRepository(db)
        self.folio_service = FolioService(db)
        self.booking_repository = BookingRepository(db)
        self.guest_repository = GuestRepository(db)
        self.room_repository = RoomRepository(db)

    def _generate_invoice_number(self) -> str:
        while True:
            number = generate_reference("INV")
            if self.repository.get_by_number(number) is None:
                return number

    def _get_source_data(
        self,
        folio_id: int,
        *,
        lock_booking: bool = False,
    ) -> tuple[Folio, Booking, Guest, Room]:
        folio = self.folio_service.get_folio(folio_id)

        if folio is None:
            raise NotFoundError("Folio not found.")

        if folio.status == "void":
            raise StateError("Cannot create an invoice for a void folio.")

        booking = (
            self.booking_repository.get_by_id_for_update(folio.booking_id)
            if lock_booking
            else self.booking_repository.get_by_id(folio.booking_id)
        )

        if booking is None:
            raise NotFoundError("Booking not found.")

        if booking.status == "cancelled":
            raise StateError("Cannot create an invoice for a cancelled booking.")

        guest = self.guest_repository.get_by_id(booking.guest_id)

        if guest is None:
            raise NotFoundError("Guest not found.")

        room = self.room_repository.get_by_id(booking.room_id)

        if room is None:
            raise NotFoundError("Room not found.")

        return folio, booking, guest, room

    def _apply_snapshot(
        self,
        invoice: Invoice,
        folio,
        booking: Booking,
        guest: Guest,
        room: Room,
    ) -> None:
        subtotal, tax_total, grand_total = self.folio_service.get_totals(folio.id)
        paid_amount, balance_due = self.folio_service.get_balance(folio.id)

        invoice.folio_id = folio.id
        invoice.booking_id = booking.id
        invoice.currency = folio.currency
        invoice.bill_to_name = (f"{guest.first_name} {guest.last_name}").strip()
        invoice.bill_to_phone = guest.phone
        invoice.bill_to_email = guest.email
        invoice.bill_to_address = guest.address
        invoice.booking_reference = booking.booking_reference
        invoice.room_number = room.room_number
        invoice.check_in = booking.check_in
        invoice.check_out = booking.check_out
        invoice.subtotal = subtotal
        invoice.tax_total = tax_total
        invoice.grand_total = grand_total
        invoice.paid_amount = paid_amount
        invoice.balance_due = balance_due

    def _replace_items(self, invoice_id: int, folio_id: int) -> None:
        self.repository.delete_items(invoice_id)

        for item in self.folio_service.list_items(folio_id):
            self.repository.create_item(
                invoice_id=invoice_id,
                folio_item_id=item.id,
                item_type=item.item_type,
                description=item.description,
                quantity=item.quantity,
                unit_price=item.unit_price,
                tax_percent=item.tax_percent,
                amount=item.amount,
                tax_amount=item.tax_amount,
                total_amount=item.total_amount,
            )

    def list_invoices(self, status: str | None = None) -> list[Invoice]:
        return self.repository.list_all(status=status)

    def get_invoice(self, invoice_id: int) -> Invoice | None:
        return self.repository.get_by_id(invoice_id)

    def get_invoice_by_folio(self, folio_id: int) -> Invoice | None:
        return self.repository.get_active_by_folio(folio_id)

    def list_items(self, invoice_id: int) -> list[InvoiceItem]:
        if self.repository.get_by_id(invoice_id) is None:
            raise NotFoundError("Invoice not found.")

        return self.repository.list_items(invoice_id)

    def create_draft(
        self,
        folio_id: int,
        notes: str | None,
    ) -> Invoice:
        existing = self.repository.get_active_by_folio(folio_id)

        if existing is not None:
            raise ConflictError("Invoice already exists for this folio.")

        folio, booking, guest, room = self._get_source_data(folio_id)

        try:
            invoice = self.repository.create(
                invoice_number=self._generate_invoice_number(),
                folio_id=folio.id,
                booking_id=booking.id,
                currency=folio.currency,
                bill_to_name="",
                bill_to_phone=guest.phone,
                bill_to_email=guest.email,
                bill_to_address=guest.address,
                booking_reference=booking.booking_reference,
                room_number=room.room_number,
                check_in=booking.check_in,
                check_out=booking.check_out,
                subtotal=ZERO_MONEY,
                tax_total=ZERO_MONEY,
                grand_total=ZERO_MONEY,
                paid_amount=ZERO_MONEY,
                balance_due=ZERO_MONEY,
                notes=notes,
            )
        except IntegrityError as exc:
            raise ConflictError("Invoice already exists for this folio.") from exc

        self._apply_snapshot(invoice, folio, booking, guest, room)
        self._replace_items(invoice.id, folio.id)

        return invoice

    def finalize_invoice(
        self,
        invoice_id: int,
        finalized_by: int,
    ) -> Invoice | None:
        invoice = self.repository.get_by_id(invoice_id)

        if invoice is None:
            return None

        if invoice.status == "finalized":
            raise StateError("Invoice is already finalized.")

        if invoice.status == "void":
            raise StateError("A void invoice cannot be finalized.")

        folio, booking, guest, room = self._get_source_data(
            invoice.folio_id,
            lock_booking=True,
        )

        self._apply_snapshot(invoice, folio, booking, guest, room)
        self._replace_items(invoice.id, folio.id)

        invoice.status = "finalized"
        invoice.finalized_at = datetime.now(UTC)
        invoice.finalized_by = finalized_by

        return invoice

    def void_invoice(self, invoice_id: int) -> Invoice | None:
        invoice = self.repository.get_by_id(invoice_id)

        if invoice is None:
            return None

        if invoice.status != "finalized":
            raise StateError("Only finalized invoices can be voided.")

        invoice.status = "void"

        return invoice
