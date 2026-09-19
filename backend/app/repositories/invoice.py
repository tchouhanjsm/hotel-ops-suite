from decimal import Decimal

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.invoice import Invoice, InvoiceItem


class InvoiceRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, invoice_id: int) -> Invoice | None:
        return self.db.get(Invoice, invoice_id)

    def get_by_number(self, invoice_number: str) -> Invoice | None:
        statement = select(Invoice).where(Invoice.invoice_number == invoice_number)
        return self.db.scalar(statement)

    def get_active_by_folio(self, folio_id: int) -> Invoice | None:
        statement = (
            select(Invoice)
            .where(
                Invoice.folio_id == folio_id,
                Invoice.status != "void",
            )
            .order_by(Invoice.id.desc())
        )
        return self.db.scalar(statement)

    def list_all(self, status: str | None = None) -> list[Invoice]:
        statement = select(Invoice).order_by(Invoice.id.desc())

        if status is not None:
            statement = statement.where(Invoice.status == status)

        return list(self.db.scalars(statement).all())

    def list_items(self, invoice_id: int) -> list[InvoiceItem]:
        statement = (
            select(InvoiceItem)
            .where(InvoiceItem.invoice_id == invoice_id)
            .order_by(InvoiceItem.id)
        )
        return list(self.db.scalars(statement).all())

    def create(
        self,
        *,
        invoice_number: str,
        folio_id: int,
        booking_id: int,
        currency: str,
        bill_to_name: str,
        bill_to_phone: str,
        bill_to_email: str | None,
        bill_to_address: str | None,
        booking_reference: str,
        room_number: str,
        check_in,
        check_out,
        subtotal: Decimal,
        tax_total: Decimal,
        grand_total: Decimal,
        paid_amount: Decimal,
        balance_due: Decimal,
        notes: str | None,
    ) -> Invoice:
        invoice = Invoice(
            invoice_number=invoice_number,
            folio_id=folio_id,
            booking_id=booking_id,
            status="draft",
            currency=currency,
            bill_to_name=bill_to_name,
            bill_to_phone=bill_to_phone,
            bill_to_email=bill_to_email,
            bill_to_address=bill_to_address,
            booking_reference=booking_reference,
            room_number=room_number,
            check_in=check_in,
            check_out=check_out,
            subtotal=subtotal,
            tax_total=tax_total,
            grand_total=grand_total,
            paid_amount=paid_amount,
            balance_due=balance_due,
            notes=notes,
        )
        self.db.add(invoice)
        self.db.flush()
        self.db.refresh(invoice)
        return invoice

    def create_item(
        self,
        *,
        invoice_id: int,
        folio_item_id: int | None,
        item_type: str,
        description: str,
        quantity: Decimal,
        unit_price: Decimal,
        tax_percent: Decimal,
        amount: Decimal,
        tax_amount: Decimal,
        total_amount: Decimal,
    ) -> InvoiceItem:
        item = InvoiceItem(
            invoice_id=invoice_id,
            folio_item_id=folio_item_id,
            item_type=item_type,
            description=description,
            quantity=quantity,
            unit_price=unit_price,
            tax_percent=tax_percent,
            amount=amount,
            tax_amount=tax_amount,
            total_amount=total_amount,
        )
        self.db.add(item)
        self.db.flush()
        self.db.refresh(item)
        return item

    def delete_items(self, invoice_id: int) -> None:
        self.db.execute(delete(InvoiceItem).where(InvoiceItem.invoice_id == invoice_id))
        self.db.flush()
