#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"

if [[ -x "$ROOT/backend/.venv/bin/python" ]]; then
  PYTHON_BIN="$ROOT/backend/.venv/bin/python"
elif [[ -x "$ROOT/.venv/bin/python" ]]; then
  PYTHON_BIN="$ROOT/.venv/bin/python"
elif command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="$(command -v python3)"
else
  echo "ERROR: No Python interpreter found."
  exit 1
fi

"$PYTHON_BIN" -c "import sqlalchemy" 2>/dev/null || {
  echo "ERROR: Selected Python does not have SQLAlchemy installed:"
  echo "       $PYTHON_BIN"
  exit 1
}

"$PYTHON_BIN" - <<'PY'
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
