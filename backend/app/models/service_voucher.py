from datetime import UTC, date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ServiceVoucher(Base):
    __tablename__ = "service_vouchers"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    voucher_number: Mapped[str] = mapped_column(
        String(30),
        unique=True,
        index=True,
    )
    voucher_date: Mapped[date] = mapped_column(Date)
    folio_id: Mapped[int] = mapped_column(
        ForeignKey("folios.id"),
        index=True,
    )
    folio_item_id: Mapped[int | None] = mapped_column(
        ForeignKey("folio_items.id"),
        nullable=True,
        unique=True,
        index=True,
    )
    service_category: Mapped[str] = mapped_column(String(100))
    service_name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    quantity: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    tax_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(3), default="INR")
    status: Mapped[str] = mapped_column(String(20), default="draft")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[int] = mapped_column(ForeignKey("staff.id"))
    issued_by: Mapped[int | None] = mapped_column(
        ForeignKey("staff.id"),
        nullable=True,
    )
    issued_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    cancelled_by: Mapped[int | None] = mapped_column(
        ForeignKey("staff.id"),
        nullable=True,
    )
    cancelled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )
