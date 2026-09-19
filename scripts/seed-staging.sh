#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ ! -f "$ROOT/.env.staging.local" ]]; then
  echo "ERROR: .env.staging.local not found."
  exit 1
fi

set -a
source "$ROOT/.env.staging.local"
set +a

: "${STAGING_DATABASE_URL:?STAGING_DATABASE_URL missing}"

cd "$ROOT/backend"

"$ROOT/backend/.venv/bin/python" - <<'PY'
import os
from datetime import date

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.models.guest import Guest
from app.models.room import Room
from app.models.booking import Booking

database_url = os.environ["STAGING_DATABASE_URL"]

if "hotel_ops_staging" not in database_url:
    raise SystemExit("ERROR: refusing to seed non-staging database.")

engine = create_engine(database_url)

with Session(engine) as db:
    # ---------------------------------------------------------
    # Baseline room
    # ---------------------------------------------------------
    room = db.scalar(
        select(Room).where(Room.room_number == "UAT-201")
    )

    if room is None:
        room = Room(
            room_number="UAT-201",
            room_name="UAT Heritage Room",
            room_type="Heritage",
            floor=2,
            capacity=2,
            status="available",
            is_active=True,
        )
        db.add(room)
        db.flush()
    else:
        room.room_name = "UAT Heritage Room"
        room.room_type = "Heritage"
        room.floor = 2
        room.capacity = 2
        room.status = "available"
        room.is_active = True

    # ---------------------------------------------------------
    # Baseline guest
    # ---------------------------------------------------------
    guest = db.scalar(
        select(Guest).where(Guest.phone == "9999900201")
    )

    if guest is None:
        guest = Guest(
            first_name="UAT",
            last_name="Guest",
            phone="9999900201",
            email="uat.guest@hotel-ops.local",
            city="Jaisalmer",
            country="India",
            notes="STAGING UAT DATA",
            is_active=True,
        )
        db.add(guest)
        db.flush()
    else:
        guest.first_name = "UAT"
        guest.last_name = "Guest"
        guest.email = "uat.guest@hotel-ops.local"
        guest.city = "Jaisalmer"
        guest.country = "India"
        guest.notes = "STAGING UAT DATA"
        guest.is_active = True

    db.commit()

    print("Staging seed complete.")
    print(f"Room:  {room.room_number} (id={room.id})")
    print(f"Guest: {guest.first_name} {guest.last_name} (id={guest.id})")
PY
