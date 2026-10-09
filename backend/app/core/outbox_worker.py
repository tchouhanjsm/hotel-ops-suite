import asyncio

from app.core.outbox_processor import process_pending
from app.db.session import SessionLocal


def process_outbox_once() -> int:
    db = SessionLocal()
    try:
        return process_pending(db)
    finally:
        db.close()


async def run_outbox_worker(
    stop_event: asyncio.Event,
    interval_seconds: float = 2.0,
) -> None:
    while not stop_event.is_set():
        await asyncio.to_thread(process_outbox_once)

        try:
            await asyncio.wait_for(
                stop_event.wait(),
                timeout=interval_seconds,
            )
        except TimeoutError:
            continue
