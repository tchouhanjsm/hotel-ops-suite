from collections.abc import Generator

import pytest
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api import dependencies
from app.db.session import engine


def test_database_connection() -> None:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        assert result.scalar_one() == 1


class FakeSession:
    def __init__(self) -> None:
        self.rollback_called = False
        self.close_called = False

    def rollback(self) -> None:
        self.rollback_called = True

    def close(self) -> None:
        self.close_called = True


def test_get_db_rolls_back_and_closes_on_exception(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    fake_session = FakeSession()
    monkeypatch.setattr(dependencies, "SessionLocal", lambda: fake_session)

    db_generator: Generator[Session] = dependencies.get_db()
    assert next(db_generator) is fake_session

    with pytest.raises(RuntimeError, match="boom"):
        db_generator.throw(RuntimeError("boom"))

    assert fake_session.rollback_called is True
    assert fake_session.close_called is True
