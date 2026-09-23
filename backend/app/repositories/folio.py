from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.folio import Folio, FolioItem


class FolioRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, folio_id: int) -> Folio | None:
        return self.db.get(Folio, folio_id)

    def get_by_id_for_update(self, folio_id: int) -> Folio | None:
        statement = (
            select(Folio)
            .where(Folio.id == folio_id)
            .with_for_update()
        )
        return self.db.scalar(statement)

    def get_by_booking_id(self, booking_id: int) -> Folio | None:
        statement = select(Folio).where(Folio.booking_id == booking_id)
        return self.db.scalar(statement)

    def get_by_number(self, folio_number: str) -> Folio | None:
        statement = select(Folio).where(Folio.folio_number == folio_number)
        return self.db.scalar(statement)

    def list_items(self, folio_id: int) -> list[FolioItem]:
        statement = (
            select(FolioItem)
            .where(FolioItem.folio_id == folio_id)
            .order_by(FolioItem.id)
        )
        return list(self.db.scalars(statement).all())

    def list_active_items(self, folio_id: int) -> list[FolioItem]:
        statement = (
            select(FolioItem)
            .where(
                FolioItem.folio_id == folio_id,
                FolioItem.status == "active",
            )
            .order_by(FolioItem.id)
        )
        return list(self.db.scalars(statement).all())

    def get_item_by_id(self, item_id: int) -> FolioItem | None:
        return self.db.get(FolioItem, item_id)

    def create_folio(
        self,
        folio_number: str,
        booking_id: int,
        currency: str,
        notes: str | None,
    ) -> Folio:
        folio = Folio(
            folio_number=folio_number,
            booking_id=booking_id,
            currency=currency,
            notes=notes,
        )
        self.db.add(folio)
        self.db.flush()
        self.db.refresh(folio)
        return folio

    def create_item(
        self,
        folio_id: int,
        item_type: str,
        description: str,
        quantity: Decimal,
        unit_price: Decimal,
        tax_percent: Decimal,
        amount: Decimal,
        tax_amount: Decimal,
        total_amount: Decimal,
    ) -> FolioItem:
        item = FolioItem(
            folio_id=folio_id,
            item_type=item_type,
            description=description,
            quantity=quantity,
            unit_price=unit_price,
            tax_percent=tax_percent,
            amount=amount,
            tax_amount=tax_amount,
            total_amount=total_amount,
        )
        self.db.add(item)
        self.db.flush()
        self.db.refresh(item)
        return item

    def void_item(self, item: FolioItem, voided_by: int) -> FolioItem:
        item.status = "voided"
        item.voided_at = datetime.now(UTC)
        item.voided_by = voided_by
        self.db.flush()
        self.db.refresh(item)
        return item
