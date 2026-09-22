from datetime import date
from decimal import Decimal
from typing import Any

from sqlalchemy.orm import Session

from app.core.errors import NotFoundError, StateError
from app.core.identifiers import generate_reference
from app.core.money import calculate_line_amount, calculate_tax, calculate_total
from app.models.folio import Folio
from app.models.service_voucher import ServiceVoucher
from app.repositories.folio import FolioRepository
from app.repositories.service_voucher import ServiceVoucherRepository


class ServiceVoucherService:
    def __init__(self, db: Session) -> None:
        self.repository = ServiceVoucherRepository(db)
        self.folio_repository = FolioRepository(db)

    def _generate_number(self) -> str:
        while True:
            number = generate_reference("SV")
            if self.repository.get_by_number(number) is None:
                return number

    @staticmethod
    def _clean(value: str) -> str:
        return value.strip()

    def _get_open_folio(self, folio_id: int) -> Folio:
        folio = self.folio_repository.get_by_id(folio_id)

        if folio is None:
            raise NotFoundError("Folio not found.")

        if folio.status != "open":
            raise StateError("Folio is not open.")

        return folio

    @staticmethod
    def _calculate(
        quantity: Decimal,
        unit_price: Decimal,
        tax_percent: Decimal,
    ) -> tuple[Decimal, Decimal, Decimal]:
        amount = calculate_line_amount(quantity, unit_price)
        tax_amount = calculate_tax(amount, tax_percent)
        total_amount = calculate_total(amount, tax_amount)
        return amount, tax_amount, total_amount

    def list_vouchers(self, status: str | None = None) -> list[ServiceVoucher]:
        return self.repository.list_all(status=status)

    def get_voucher(self, voucher_id: int) -> ServiceVoucher | None:
        return self.repository.get_by_id(voucher_id)

    def create_voucher(
        self,
        *,
        voucher_date: date,
        folio_id: int,
        service_category: str,
        service_name: str,
        description: str,
        quantity: Decimal,
        unit_price: Decimal,
        tax_percent: Decimal,
        notes: str | None,
        created_by: int,
    ) -> ServiceVoucher:
        folio = self._get_open_folio(folio_id)
        amount, tax_amount, total_amount = self._calculate(
            quantity,
            unit_price,
            tax_percent,
        )

        return self.repository.create(
            voucher_number=self._generate_number(),
            voucher_date=voucher_date,
            folio_id=folio.id,
            service_category=self._clean(service_category),
            service_name=self._clean(service_name),
            description=self._clean(description),
            quantity=quantity,
            unit_price=unit_price,
            tax_percent=tax_percent,
            amount=amount,
            tax_amount=tax_amount,
            total_amount=total_amount,
            currency=folio.currency,
            notes=self._clean(notes) if notes else None,
            created_by=created_by,
        )

    def update_voucher(
        self,
        voucher_id: int,
        updates: dict[str, Any],
    ) -> ServiceVoucher:
        voucher = self.repository.get_by_id(voucher_id)

        if voucher is None:
            raise NotFoundError("Service voucher not found.")

        if voucher.status != "draft":
            raise StateError("Only draft service vouchers can be updated.")

        self._get_open_folio(voucher.folio_id)

        cleaned = dict(updates)

        for field in (
            "service_category",
            "service_name",
            "description",
            "notes",
        ):
            if field in cleaned:
                value = cleaned[field]
                cleaned[field] = self._clean(value) if value else None

        quantity = cleaned.get("quantity", voucher.quantity)
        unit_price = cleaned.get("unit_price", voucher.unit_price)
        tax_percent = cleaned.get("tax_percent", voucher.tax_percent)

        amount, tax_amount, total_amount = self._calculate(
            quantity,
            unit_price,
            tax_percent,
        )
        cleaned.update(
            amount=amount,
            tax_amount=tax_amount,
            total_amount=total_amount,
        )

        return self.repository.update(voucher, cleaned)

    def issue_voucher(
        self,
        voucher_id: int,
        *,
        issued_by: int,
    ) -> ServiceVoucher:
        voucher = self.repository.get_by_id(voucher_id)

        if voucher is None:
            raise NotFoundError("Service voucher not found.")

        if voucher.status != "draft":
            raise StateError("Only draft service vouchers can be issued.")

        folio = self._get_open_folio(voucher.folio_id)

        from app.services.folio import FolioService

        item = FolioService(self.folio_repository.db).add_item(
            folio_id=folio.id,
            item_type="service",
            description=f"{voucher.service_name} - {voucher.description}",
            quantity=voucher.quantity,
            unit_price=voucher.unit_price,
            tax_percent=voucher.tax_percent,
        )

        return self.repository.mark_issued(
            voucher,
            folio_item_id=item.id,
            amount=item.amount,
            tax_amount=item.tax_amount,
            total_amount=item.total_amount,
            issued_by=issued_by,
        )

    def cancel_voucher(
        self,
        voucher_id: int,
        *,
        cancelled_by: int,
    ) -> ServiceVoucher:
        voucher = self.repository.get_by_id(voucher_id)

        if voucher is None:
            raise NotFoundError("Service voucher not found.")

        if voucher.status != "draft":
            raise StateError(
                "Only draft service vouchers can be cancelled.",
            )

        return self.repository.cancel_draft(voucher, cancelled_by)
