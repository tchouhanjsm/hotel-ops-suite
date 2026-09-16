import secrets
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.payment import Payment
from app.repositories.folio import FolioRepository
from app.repositories.payment import PaymentRepository
from app.services.folio import FolioService


class PaymentService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = PaymentRepository(db)
        self.folio_repository = FolioRepository(db)
        self.folio_service = FolioService(db)

    def _generate_reference(self) -> str:
        while True:
            reference = f"PAY-{secrets.token_hex(4).upper()}"
            statement = select(Payment).where(Payment.payment_reference == reference)

            if self.db.scalar(statement) is None:
                return reference

    def list_payments(self, folio_id: int) -> list[Payment]:
        if self.folio_repository.get_by_id(folio_id) is None:
            raise ValueError("Folio not found.")

        return self.repository.list_by_folio(folio_id)

    def create_payment(
        self,
        folio_id: int,
        amount: Decimal,
        payment_method: str,
        received_by: int,
        external_reference: str | None,
        notes: str | None,
    ) -> Payment:
        folio = self.folio_repository.get_by_id(folio_id)

        if folio is None:
            raise ValueError("Folio not found.")

        if folio.status != "open":
            raise ValueError("Folio is not open.")

        _, balance_due = self.folio_service.get_balance(folio_id)

        if amount > balance_due:
            raise ValueError("Payment exceeds outstanding balance.")

        return self.repository.create(
            payment_reference=self._generate_reference(),
            folio_id=folio_id,
            amount=amount,
            payment_method=payment_method,
            received_by=received_by,
            external_reference=external_reference,
            notes=notes,
        )

    def void_payment(self, payment_id: int) -> Payment | None:
        payment = self.repository.get_by_id(payment_id)

        if payment is None:
            return None

        if payment.status != "completed":
            raise ValueError("Only completed payments can be voided.")

        payment.status = "voided"
        self.db.flush()
        self.db.refresh(payment)

        return payment
