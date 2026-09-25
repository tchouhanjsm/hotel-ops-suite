from sqlalchemy.orm import Session

from app.core.event_dispatcher import dispatch
from app.core.events import DomainEvent
from app.repositories.outbox import OutboxRepository


def process_pending(db: Session, limit: int = 100) -> int:
    repository = OutboxRepository(db)
    processed = 0

    for record in repository.list_pending(limit):
        event = DomainEvent(
            event_type=record.event_type,
            aggregate_type=record.aggregate_type,
            aggregate_id=record.aggregate_id,
            payload=record.payload,
            event_id=record.event_id,
            occurred_at=record.occurred_at,
        )

        try:
            with db.begin_nested():
                dispatch(event, db)
                repository.mark_published(record)

            processed += 1

        except Exception as exc:
            repository.mark_failed(record, str(exc))

    db.commit()
    return processed
