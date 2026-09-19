from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.payment import Payment


class PaymentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, payment_id: int) -> Payment | None:
        return self.db.get(Payment, payment_id)

    def get_by_reference(self, reference: str) -> Payment | None:
        statement = select(Payment).where(
            Payment.payment_reference == reference,
        )
        return self.db.scalar(statement)

    def list_by_folio(self, folio_id: int) -> list[Payment]:
        statement = (
            select(Payment)
            .where(Payment.folio_id == folio_id)
            .order_by(Payment.id.desc())
        )
        return list(self.db.scalars(statement).all())

    def create(
        self,
        payment_reference: str,
        folio_id: int,
        amount: Decimal,
        payment_method: str,
        received_by: int,
        external_reference: str | None,
        notes: str | None,
    ) -> Payment:
        payment = Payment(
            payment_reference=payment_reference,
            folio_id=folio_id,
            amount=amount,
            payment_method=payment_method,
            received_by=received_by,
            external_reference=external_reference,
            notes=notes,
        )
        self.db.add(payment)
        self.db.flush()
        self.db.refresh(payment)
        return payment
