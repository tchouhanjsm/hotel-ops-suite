from datetime import UTC, date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.cash_voucher import CashVoucher


class CashVoucherRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, voucher_id: int) -> CashVoucher | None:
        return self.db.get(CashVoucher, voucher_id)

    def get_by_number(self, voucher_number: str) -> CashVoucher | None:
        statement = select(CashVoucher).where(
            CashVoucher.voucher_number == voucher_number,
        )
        return self.db.scalar(statement)

    def list_all(self, status: str | None = None) -> list[CashVoucher]:
        statement = select(CashVoucher).order_by(
            CashVoucher.voucher_date.desc(),
            CashVoucher.id.desc(),
        )

        if status is not None:
            statement = statement.where(CashVoucher.status == status)

        return list(self.db.scalars(statement).all())

    def create(
        self,
        *,
        voucher_number: str,
        voucher_date: date,
        payee_name: str,
        expense_category: str,
        description: str,
        amount: Decimal,
        currency: str,
        external_reference: str | None,
        notes: str | None,
        created_by: int,
    ) -> CashVoucher:
        voucher = CashVoucher(
            voucher_number=voucher_number,
            voucher_date=voucher_date,
            payee_name=payee_name,
            expense_category=expense_category,
            description=description,
            amount=amount,
            currency=currency.upper(),
            external_reference=external_reference,
            notes=notes,
            created_by=created_by,
        )
        self.db.add(voucher)
        self.db.flush()
        self.db.refresh(voucher)
        return voucher

    def update(
        self,
        voucher: CashVoucher,
        updates: dict[str, Any],
        updated_by: int,
    ) -> CashVoucher:
        for field in (
            "voucher_date",
            "payee_name",
            "expense_category",
            "description",
            "amount",
            "external_reference",
            "notes",
        ):
            if field in updates:
                setattr(voucher, field, updates[field])

        voucher.updated_by = updated_by
        voucher.updated_at = datetime.now(UTC)
        self.db.flush()
        self.db.refresh(voucher)
        return voucher

    def cancel(self, voucher: CashVoucher, cancelled_by: int) -> CashVoucher:
        cancelled_at = datetime.now(UTC)
        voucher.status = "cancelled"
        voucher.cancelled_by = cancelled_by
        voucher.cancelled_at = cancelled_at
        voucher.updated_by = cancelled_by
        voucher.updated_at = cancelled_at
        self.db.flush()
        self.db.refresh(voucher)
        return voucher
