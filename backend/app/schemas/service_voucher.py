from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class ServiceVoucherStatus(StrEnum):
    DRAFT = "draft"
    ISSUED = "issued"
    CANCELLED = "cancelled"


class ServiceVoucherCreate(BaseModel):
    voucher_date: date
    folio_id: int = Field(gt=0)
    service_category: str = Field(min_length=1, max_length=100)
    service_name: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=1000)
    quantity: Decimal = Field(gt=0, decimal_places=2)
    unit_price: Decimal = Field(gt=0, decimal_places=2)
    tax_percent: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
        le=100,
        decimal_places=2,
    )
    notes: str | None = Field(default=None, max_length=2000)


class ServiceVoucherUpdate(BaseModel):
    voucher_date: date | None = None
    service_category: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    service_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=200,
    )
    description: str | None = Field(
        default=None,
        min_length=1,
        max_length=1000,
    )
    quantity: Decimal | None = Field(
        default=None,
        gt=0,
        decimal_places=2,
    )
    unit_price: Decimal | None = Field(
        default=None,
        gt=0,
        decimal_places=2,
    )
    tax_percent: Decimal | None = Field(
        default=None,
        ge=0,
        le=100,
        decimal_places=2,
    )
    notes: str | None = Field(default=None, max_length=2000)


class ServiceVoucherRead(BaseModel):
    id: int
    voucher_number: str
    voucher_date: date
    folio_id: int
    folio_item_id: int | None
    service_category: str
    service_name: str
    description: str
    quantity: Decimal
    unit_price: Decimal
    tax_percent: Decimal
    amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    currency: str
    status: ServiceVoucherStatus
    notes: str | None
    created_by: int
    issued_by: int | None
    issued_at: datetime | None
    cancelled_by: int | None
    cancelled_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
