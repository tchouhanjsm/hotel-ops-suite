#!/usr/bin/env bash

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PYTHON_BIN="$ROOT/backend/.venv/bin/python"

if [[ ! -x "$PYTHON_BIN" ]]; then
  echo "ERROR: Canonical backend Python environment not found:"
  echo "       $PYTHON_BIN"
  echo "Run: npm run backend:bootstrap"
  exit 1
fi

"$PYTHON_BIN" -c "import sqlalchemy" 2>/dev/null
if [[ $? -ne 0 ]]; then
  echo "ERROR: Backend environment is missing SQLAlchemy:"
  echo "       $PYTHON_BIN"
  echo "Run: npm run backend:bootstrap"
  exit 1
fi

PYTHONPATH="$ROOT/backend" "$PYTHON_BIN" - <<'PY'
from sqlalchemy.engine import make_url

from app.core.config import settings
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.staff import Staff

if not settings.database_url:
    raise SystemExit("ERROR: DATABASE_URL is not configured.")

url = make_url(settings.database_url)

if url.database != "hotel_ops":
    raise SystemExit(
        f"ERROR: Refusing reset against database {url.database!r}. "
        "Expected local database 'hotel_ops'."
    )

if url.host not in {"localhost", "127.0.0.1"}:
    raise SystemExit(
        f"ERROR: Refusing reset against host {url.host!r}."
    )

db = SessionLocal()

try:
    staff = db.query(Staff).filter(Staff.username == "admin").first()

    if staff is None:
        staff = Staff(
            username="admin",
            password_hash=hash_password("admin"),
            full_name="Local Admin",
            role="admin",
            is_active=True,
        )
        db.add(staff)
    else:
        staff.password_hash = hash_password("admin")
        staff.full_name = "Local Admin"
        staff.role = "admin"
        staff.is_active = True

    db.commit()

    print("Local admin reset successfully.")
    print("Username: admin")
    print("Password: admin")
    print("Role: admin")

finally:
    db.close()
PY

echo "Local admin reset completed."
