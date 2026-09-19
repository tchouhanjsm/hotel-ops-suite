from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class InvoiceStatus(StrEnum):
    DRAFT = "draft"
    FINALIZED = "finalized"
    VOID = "void"


class InvoiceCreate(BaseModel):
    folio_id: int = Field(gt=0)
    notes: str | None = None


class InvoiceItemRead(BaseModel):
    id: int
    invoice_id: int
    folio_item_id: int | None
    item_type: str
    description: str
    quantity: Decimal
    unit_price: Decimal
    tax_percent: Decimal
    amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InvoiceRead(BaseModel):
    id: int
    invoice_number: str
    folio_id: int
    booking_id: int
    status: InvoiceStatus
    currency: str

    bill_to_name: str
    bill_to_phone: str
    bill_to_email: str | None
    bill_to_address: str | None

    booking_reference: str
    room_number: str
    check_in: date
    check_out: date

    subtotal: Decimal
    tax_total: Decimal
    grand_total: Decimal
    paid_amount: Decimal
    balance_due: Decimal

    notes: str | None
    finalized_at: datetime | None
    finalized_by: int | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
