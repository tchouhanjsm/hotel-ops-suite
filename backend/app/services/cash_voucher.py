from datetime import date
from decimal import Decimal
from typing import Any

from sqlalchemy.orm import Session

from app.core.errors import NotFoundError, StateError
from app.core.identifiers import generate_reference
from app.models.cash_voucher import CashVoucher
from app.repositories.cash_voucher import CashVoucherRepository


class CashVoucherService:
    def __init__(self, db: Session) -> None:
        self.repository = CashVoucherRepository(db)

    def _generate_number(self) -> str:
        while True:
            number = generate_reference("CV")
            if self.repository.get_by_number(number) is None:
                return number

    @staticmethod
    def _clean(value: str) -> str:
        return value.strip()

    def list_vouchers(self, status: str | None = None) -> list[CashVoucher]:
        return self.repository.list_all(status=status)

    def get_voucher(self, voucher_id: int) -> CashVoucher | None:
        return self.repository.get_by_id(voucher_id)

    def create_voucher(
        self,
        *,
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
        return self.repository.create(
            voucher_number=self._generate_number(),
            voucher_date=voucher_date,
            payee_name=self._clean(payee_name),
            expense_category=self._clean(expense_category),
            description=self._clean(description),
            amount=amount,
            currency=currency,
            external_reference=self._clean(external_reference)
            if external_reference
            else None,
            notes=self._clean(notes) if notes else None,
            created_by=created_by,
        )

    def update_voucher(
        self,
        voucher_id: int,
        updates: dict[str, Any],
        *,
        updated_by: int,
    ) -> CashVoucher:
        voucher = self.repository.get_by_id(voucher_id)

        if voucher is None:
            raise NotFoundError("Cash voucher not found.")

        if voucher.status != "active":
            raise StateError("Only active cash vouchers can be updated.")

        cleaned: dict[str, Any] = {}

        for field in (
            "payee_name",
            "expense_category",
            "description",
            "external_reference",
            "notes",
        ):
            if field in updates:
                value = updates[field]
                cleaned[field] = self._clean(value) if value else None

        if "voucher_date" in updates:
            cleaned["voucher_date"] = updates["voucher_date"]

        if "amount" in updates:
            cleaned["amount"] = updates["amount"]

        return self.repository.update(voucher, cleaned, updated_by)

    def cancel_voucher(
        self,
        voucher_id: int,
        *,
        cancelled_by: int,
    ) -> CashVoucher:
        voucher = self.repository.get_by_id(voucher_id)

        if voucher is None:
            raise NotFoundError("Cash voucher not found.")

        if voucher.status != "active":
            raise StateError("Only active cash vouchers can be cancelled.")

        return self.repository.cancel(voucher, cancelled_by)
