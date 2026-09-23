from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class FolioStatus(StrEnum):
    OPEN = "open"
    CLOSED = "closed"
    VOID = "void"


class FolioItemStatus(StrEnum):
    ACTIVE = "active"
    VOIDED = "voided"


class FolioItemType(StrEnum):
    ROOM_CHARGE = "room_charge"
    FOOD = "food"
    SERVICE = "service"
    TAX = "tax"
    ADJUSTMENT = "adjustment"
    OTHER = "other"


class FolioCreate(BaseModel):
    booking_id: int = Field(gt=0)
    currency: str = Field(default="INR", min_length=3, max_length=3)
    notes: str | None = None


class FolioItemCreate(BaseModel):
    item_type: FolioItemType
    description: str = Field(min_length=1, max_length=200)
    quantity: Decimal = Field(default=Decimal("1.00"), gt=0)
    unit_price: Decimal = Field(gt=0, decimal_places=2)
    tax_percent: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
        le=100,
        decimal_places=2,
    )


class FolioItemRead(FolioItemCreate):
    id: int
    folio_id: int
    amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    status: FolioItemStatus
    voided_at: datetime | None
    voided_by: int | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FolioRead(BaseModel):
    id: int
    folio_number: str
    booking_id: int
    status: FolioStatus
    currency: str
    notes: str | None
    created_at: datetime
    subtotal: Decimal
    tax_total: Decimal
    grand_total: Decimal

    model_config = ConfigDict(from_attributes=True)


class FolioSummary(BaseModel):
    id: int
    folio_number: str
    booking_id: int
    status: FolioStatus
    currency: str
    notes: str | None
    created_at: datetime
    subtotal: Decimal
    tax_total: Decimal
    grand_total: Decimal
    paid_amount: Decimal
    balance_due: Decimal
