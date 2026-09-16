from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class PaymentMethod(StrEnum):
    CASH = "cash"
    CARD = "card"
    UPI = "upi"
    BANK_TRANSFER = "bank_transfer"
    OTHER = "other"


class PaymentStatus(StrEnum):
    COMPLETED = "completed"
    VOIDED = "voided"


class PaymentCreate(BaseModel):
    folio_id: int = Field(gt=0)
    amount: Decimal = Field(gt=0, decimal_places=2)
    payment_method: PaymentMethod
    external_reference: str | None = Field(
        default=None,
        max_length=100,
    )
    notes: str | None = None


class PaymentRead(BaseModel):
    id: int
    payment_reference: str
    folio_id: int
    amount: Decimal
    payment_method: PaymentMethod
    status: PaymentStatus
    received_by: int
    received_at: datetime
    external_reference: str | None
    notes: str | None

    model_config = ConfigDict(from_attributes=True)
