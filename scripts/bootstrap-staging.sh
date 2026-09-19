#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ ! -x "$ROOT/backend/.venv/bin/python" ]]; then
  echo "ERROR: backend/.venv/bin/python not found."
  exit 1
fi

: "${STAGING_DATABASE_URL:?Set STAGING_DATABASE_URL}"
: "${STAGING_ADMIN_USERNAME:?Set STAGING_ADMIN_USERNAME}"
: "${STAGING_ADMIN_PASSWORD:?Set STAGING_ADMIN_PASSWORD}"

cd "$ROOT/backend"

STAGING_DATABASE_URL="$STAGING_DATABASE_URL" \
STAGING_ADMIN_USERNAME="$STAGING_ADMIN_USERNAME" \
STAGING_ADMIN_PASSWORD="$STAGING_ADMIN_PASSWORD" \
"$ROOT/backend/.venv/bin/python" - <<'PY'
import os

from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.staff import Staff

database_url = os.environ["STAGING_DATABASE_URL"]
url = make_url(database_url)

if url.database != "hotel_ops_staging":
    raise SystemExit(
        f"Refusing bootstrap against database {url.database!r}. "
        "Expected hotel_ops_staging."
    )

engine = create_engine(database_url)

with Session(engine) as db:
    username = os.environ["STAGING_ADMIN_USERNAME"]
    password = os.environ["STAGING_ADMIN_PASSWORD"]

    staff = db.query(Staff).filter(Staff.username == username).first()

    if staff is None:
        staff = Staff(
            username=username,
            password_hash=hash_password(password),
            full_name="Staging Admin",
            role="admin",
            is_active=True,
        )
        db.add(staff)
    else:
        staff.password_hash = hash_password(password)
        staff.full_name = "Staging Admin"
        staff.role = "admin"
        staff.is_active = True

    db.commit()

print("Staging admin bootstrap complete.")
PY
