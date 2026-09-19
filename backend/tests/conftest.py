from collections.abc import Generator

import pytest
from fastapi import Request
from sqlalchemy import create_engine, delete
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.models.booking import Booking
from app.models.folio import Folio, FolioItem
from app.models.guest import Guest
from app.models.invoice import Invoice, InvoiceItem
from app.models.payment import Payment
from app.models.room import Room

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

Base.metadata.create_all(engine)


@pytest.fixture
def http_request() -> Request:
    return Request(
        {
            "type": "http",
            "method": "GET",
            "path": "/",
            "raw_path": b"/",
            "query_string": b"",
            "headers": [],
            "scheme": "http",
            "server": ("testserver", 80),
            "client": ("testclient", 50000),
        }
    )


@pytest.fixture
def db_session() -> Generator[Session]:
    with Session(engine) as db:
        yield db


@pytest.fixture(autouse=True)
def clean_database() -> None:
    with Session(engine) as db:
        db.execute(delete(InvoiceItem))
        db.execute(delete(Invoice))
        db.execute(delete(Payment))
        db.execute(delete(FolioItem))
        db.execute(delete(Folio))
        db.execute(delete(Booking))
        db.execute(delete(Guest))
        db.execute(delete(Room))
        db.commit()


@pytest.fixture
def booking_test_data(db_session: Session) -> tuple[Guest, Room]:
    guest = Guest(
        first_name="Test",
        last_name="Guest",
        phone="9000000000",
    )

    room = Room(
        room_number="201",
        room_name="Test Room",
        room_type="Heritage",
        floor=2,
        capacity=2,
    )

    db_session.add_all([guest, room])
    db_session.commit()

    db_session.refresh(guest)
    db_session.refresh(room)

    return guest, room
