from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.events import DomainEvent
from app.models.outbox_event import OutboxEvent


class OutboxRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def enqueue(self, event: DomainEvent) -> OutboxEvent:
        record = OutboxEvent(
            event_id=event.event_id,
            event_type=event.event_type,
            aggregate_type=event.aggregate_type,
            aggregate_id=event.aggregate_id,
            payload=event.payload,
            occurred_at=event.occurred_at,
        )
        self.db.add(record)
        self.db.flush()
        self.db.refresh(record)
        return record

    def list_pending(self, limit: int = 100) -> list[OutboxEvent]:
        statement = (
            select(OutboxEvent)
            .where(OutboxEvent.published_at.is_(None))
            .order_by(OutboxEvent.id)
            .limit(limit)
        )
        return list(self.db.scalars(statement).all())

    def mark_published(self, event: OutboxEvent) -> OutboxEvent:
        event.published_at = datetime.now(UTC)
        self.db.flush()
        return event

    def mark_failed(
        self,
        event: OutboxEvent,
        error: str,
    ) -> OutboxEvent:
        event.attempts += 1
        event.last_error = error
        self.db.flush()
        return event
