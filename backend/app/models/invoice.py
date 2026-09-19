from datetime import UTC, date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Index, Numeric, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    invoice_number: Mapped[str] = mapped_column(
        String(30),
        unique=True,
        index=True,
    )
    folio_id: Mapped[int] = mapped_column(
        ForeignKey("folios.id"),
        index=True,
    )
    booking_id: Mapped[int] = mapped_column(
        ForeignKey("bookings.id"),
        index=True,
    )
    status: Mapped[str] = mapped_column(String(20), default="draft")
    currency: Mapped[str] = mapped_column(String(3), default="INR")

    bill_to_name: Mapped[str] = mapped_column(String(200))
    bill_to_phone: Mapped[str] = mapped_column(String(30))
    bill_to_email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    bill_to_address: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    booking_reference: Mapped[str] = mapped_column(String(30))
    room_number: Mapped[str] = mapped_column(String(50))
    check_in: Mapped[date] = mapped_column(Date)
    check_out: Mapped[date] = mapped_column(Date)

    subtotal: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("0.00"),
    )
    tax_total: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("0.00"),
    )
    grand_total: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("0.00"),
    )
    paid_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("0.00"),
    )
    balance_due: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("0.00"),
    )

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    finalized_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    finalized_by: Mapped[int | None] = mapped_column(
        ForeignKey("staff.id"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
    )

    __table_args__ = (
        Index(
            "uq_invoices_active_folio",
            "folio_id",
            unique=True,
            sqlite_where=text("status != 'void'"),
            postgresql_where=text("status != 'void'"),
        ),
    )


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    invoice_id: Mapped[int] = mapped_column(
        ForeignKey("invoices.id"),
        index=True,
    )
    folio_item_id: Mapped[int | None] = mapped_column(
        ForeignKey("folio_items.id"),
        nullable=True,
        index=True,
    )
    item_type: Mapped[str] = mapped_column(String(30))
    description: Mapped[str] = mapped_column(String(200))
    quantity: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        default=Decimal("1.00"),
    )
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    tax_percent: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        default=Decimal("0.00"),
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    tax_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("0.00"),
    )
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
    )
