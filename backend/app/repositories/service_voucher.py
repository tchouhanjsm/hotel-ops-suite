from datetime import UTC, date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.service_voucher import ServiceVoucher


class ServiceVoucherRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, voucher_id: int) -> ServiceVoucher | None:
        return self.db.get(ServiceVoucher, voucher_id)

    def get_by_number(self, voucher_number: str) -> ServiceVoucher | None:
        statement = select(ServiceVoucher).where(
            ServiceVoucher.voucher_number == voucher_number,
        )
        return self.db.scalar(statement)

    def list_all(self, status: str | None = None) -> list[ServiceVoucher]:
        statement = select(ServiceVoucher).order_by(
            ServiceVoucher.voucher_date.desc(),
            ServiceVoucher.id.desc(),
        )

        if status is not None:
            statement = statement.where(ServiceVoucher.status == status)

        return list(self.db.scalars(statement).all())

    def create(
        self,
        *,
        voucher_number: str,
        voucher_date: date,
        folio_id: int,
        service_category: str,
        service_name: str,
        description: str,
        quantity: Decimal,
        unit_price: Decimal,
        tax_percent: Decimal,
        amount: Decimal,
        tax_amount: Decimal,
        total_amount: Decimal,
        currency: str,
        notes: str | None,
        created_by: int,
    ) -> ServiceVoucher:
        voucher = ServiceVoucher(
            voucher_number=voucher_number,
            voucher_date=voucher_date,
            folio_id=folio_id,
            service_category=service_category,
            service_name=service_name,
            description=description,
            quantity=quantity,
            unit_price=unit_price,
            tax_percent=tax_percent,
            amount=amount,
            tax_amount=tax_amount,
            total_amount=total_amount,
            currency=currency.upper(),
            notes=notes,
            created_by=created_by,
        )
        self.db.add(voucher)
        self.db.flush()
        self.db.refresh(voucher)
        return voucher

    def update(
        self,
        voucher: ServiceVoucher,
        updates: dict[str, Any],
    ) -> ServiceVoucher:
        for field in (
            "voucher_date",
            "service_category",
            "service_name",
            "description",
            "quantity",
            "unit_price",
            "tax_percent",
            "amount",
            "tax_amount",
            "total_amount",
            "notes",
        ):
            if field in updates:
                setattr(voucher, field, updates[field])

        voucher.updated_at = datetime.now(UTC)
        self.db.flush()
        self.db.refresh(voucher)
        return voucher

    def mark_issued(
        self,
        voucher: ServiceVoucher,
        *,
        folio_item_id: int,
        amount: Decimal,
        tax_amount: Decimal,
        total_amount: Decimal,
        issued_by: int,
    ) -> ServiceVoucher:
        issued_at = datetime.now(UTC)
        voucher.folio_item_id = folio_item_id
        voucher.amount = amount
        voucher.tax_amount = tax_amount
        voucher.total_amount = total_amount
        voucher.status = "issued"
        voucher.issued_by = issued_by
        voucher.issued_at = issued_at
        voucher.updated_at = issued_at
        self.db.flush()
        self.db.refresh(voucher)
        return voucher

    def cancel_draft(
        self,
        voucher: ServiceVoucher,
        cancelled_by: int,
    ) -> ServiceVoucher:
        cancelled_at = datetime.now(UTC)
        voucher.status = "cancelled"
        voucher.cancelled_by = cancelled_by
        voucher.cancelled_at = cancelled_at
        voucher.updated_at = cancelled_at
        self.db.flush()
        self.db.refresh(voucher)
        return voucher
