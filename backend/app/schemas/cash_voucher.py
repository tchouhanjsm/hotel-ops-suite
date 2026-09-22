from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class CashVoucherStatus(StrEnum):
    ACTIVE = "active"
    CANCELLED = "cancelled"


class CashVoucherCreate(BaseModel):
    voucher_date: date
    payee_name: str = Field(min_length=1, max_length=200)
    expense_category: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=1000)
    amount: Decimal = Field(gt=0, decimal_places=2)
    currency: str = Field(default="INR", min_length=3, max_length=3)
    external_reference: str | None = Field(default=None, max_length=100)
    notes: str | None = None


class CashVoucherUpdate(BaseModel):
    voucher_date: date | None = None
    payee_name: str | None = Field(default=None, min_length=1, max_length=200)
    expense_category: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, min_length=1, max_length=1000)
    amount: Decimal | None = Field(default=None, gt=0, decimal_places=2)
    external_reference: str | None = Field(default=None, max_length=100)
    notes: str | None = None


class CashVoucherRead(BaseModel):
    id: int
    voucher_number: str
    voucher_date: date
    payee_name: str
    expense_category: str
    description: str
    amount: Decimal
    currency: str
    status: CashVoucherStatus
    external_reference: str | None
    notes: str | None
    created_by: int
    updated_by: int | None
    cancelled_by: int | None
    cancelled_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
