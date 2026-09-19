from __future__ import annotations

import sys

from sqlalchemy import create_engine, text

from common import load_env_file, required_env


REQUIRED_TABLES = {
    "alembic_version",
    "staff",
    "rooms",
    "guests",
    "bookings",
    "folios",
    "folio_items",
    "payments",
    "audit_logs",
}


def main() -> int:
    print("=== DATABASE ===")

    try:
        load_env_file()
        database_url = required_env("STAGING_DATABASE_URL")
        username = required_env("STAGING_ADMIN_USERNAME")

        if "hotel_ops_staging" not in database_url:
            raise RuntimeError(
                "Refusing database check because target is not hotel_ops_staging."
            )

        engine = create_engine(database_url, pool_pre_ping=True)

        with engine.connect() as conn:
            database = conn.execute(
                text("SELECT current_database()")
            ).scalar_one()

            if database != "hotel_ops_staging":
                raise RuntimeError(
                    f"Connected to {database}, expected hotel_ops_staging."
                )

            tables = {
                row[0]
                for row in conn.execute(
                    text("""
                        SELECT table_name
                        FROM information_schema.tables
                        WHERE table_schema = 'public'
                    """)
                )
            }

            missing = REQUIRED_TABLES - tables

            if missing:
                raise RuntimeError(
                    "Missing tables: " + ", ".join(sorted(missing))
                )

            alembic_version = conn.execute(
                text("SELECT version_num FROM alembic_version")
            ).scalar_one()

            staff = conn.execute(
                text("""
                    SELECT username, role, is_active
                    FROM staff
                    WHERE username = :username
                """),
                {"username": username},
            ).mappings().first()

            if staff is None:
                raise RuntimeError(
                    f"Staging admin '{username}' does not exist."
                )

            if not staff["is_active"]:
                raise RuntimeError(
                    f"Staging admin '{username}' is inactive."
                )

            print("[PASS] database: hotel_ops_staging")
            print(f"[PASS] alembic: {alembic_version}")
            print("[PASS] required tables present")
            print(
                f"[PASS] admin: {staff['username']} "
                f"| role={staff['role']} | active={staff['is_active']}"
            )

        return 0

    except Exception as exc:
        print(f"[FAIL] {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
