from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.errors import ConflictError, NotFoundError, StateError
from app.core.identifiers import generate_reference
from app.models.payment import Payment
from app.repositories.folio import FolioRepository
from app.repositories.payment import PaymentRepository
from app.services.folio import FolioService


class PaymentService:
    def __init__(self, db: Session) -> None:
        self.repository = PaymentRepository(db)
        self.folio_repository = FolioRepository(db)
        self.folio_service = FolioService(db)

    def _generate_reference(self) -> str:
        while True:
            reference = generate_reference("PAY")
            if self.repository.get_by_reference(reference) is None:
                return reference

    def list_payments(self, folio_id: int) -> list[Payment]:
        if self.folio_repository.get_by_id(folio_id) is None:
            raise NotFoundError("Folio not found.")

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
            raise NotFoundError("Folio not found.")

        if folio.status != "open":
            raise StateError("Folio is not open.")

        _, balance_due = self.folio_service.get_balance(folio_id)

        if amount > balance_due:
            raise ConflictError("Payment exceeds outstanding balance.")

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
            raise StateError("Only completed payments can be voided.")

        payment.status = "voided"

        return payment
