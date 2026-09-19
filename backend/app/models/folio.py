from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Folio(Base):
    __tablename__ = "folios"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    folio_number: Mapped[str] = mapped_column(
        String(30),
        unique=True,
        index=True,
    )
    booking_id: Mapped[int] = mapped_column(
        ForeignKey("bookings.id"),
        unique=True,
        index=True,
    )
    status: Mapped[str] = mapped_column(String(20), default="open")
    currency: Mapped[str] = mapped_column(String(3), default="INR")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
    )


class FolioItem(Base):
    __tablename__ = "folio_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    folio_id: Mapped[int] = mapped_column(
        ForeignKey("folios.id"),
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
