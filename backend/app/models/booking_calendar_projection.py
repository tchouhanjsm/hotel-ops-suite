from datetime import date

from sqlalchemy import Date, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class BookingCalendarProjection(Base):
    __tablename__ = "booking_calendar_projection"
    __table_args__ = (
        UniqueConstraint(
            "booking_id",
            name="booking_calendar_projection_booking_id_key",
        ),
        Index("ix_booking_calendar_projection_booking_id", "booking_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    booking_id: Mapped[int] = mapped_column(Integer)
    booking_reference: Mapped[str] = mapped_column(String(50), index=True)
    guest_id: Mapped[int] = mapped_column(Integer, index=True)
    room_id: Mapped[int] = mapped_column(Integer, index=True)
    check_in: Mapped[date] = mapped_column(Date)
    check_out: Mapped[date] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(30), index=True)
