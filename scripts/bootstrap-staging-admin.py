from datetime import datetime, timezone
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
sys.path.insert(0, str(BACKEND))

from pwdlib import PasswordHash
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.models.staff import Staff


database_url = os.environ["STAGING_DATABASE_URL"]
username = os.environ["STAGING_ADMIN_USERNAME"]
password = os.environ["STAGING_ADMIN_PASSWORD"]

if "hotel_ops_staging" not in database_url:
    raise RuntimeError("Refusing to bootstrap anything except hotel_ops_staging.")

engine = create_engine(database_url)
password_hasher = PasswordHash.recommended()

with Session(engine) as db:
    staff = db.scalar(
        select(Staff).where(Staff.username == username)
    )

    if staff is None:
        staff = Staff(
            username=username,
            password_hash=password_hasher.hash(password),
            full_name="Staging UAT Admin",
            role="admin",
            is_active=True,
            created_at=datetime.now(timezone.utc),
        )
        db.add(staff)
        print("Created staging UAT admin.")
    else:
        staff.password_hash = password_hasher.hash(password)
        staff.role = "admin"
        staff.is_active = True
        print("Reconciled staging UAT admin.")

    db.commit()
