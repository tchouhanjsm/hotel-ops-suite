"""add booking overlap constraint

Revision ID: AUTO
Revises: AUTO
Create Date: 2026-09-15
"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "cca671cf8ff5"
down_revision: str | Sequence[str] | None = "aaca23ce5f78"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS btree_gist")

    op.execute(
        """
        ALTER TABLE bookings
        ADD CONSTRAINT bookings_no_overlapping_active_room_stays
        EXCLUDE USING gist (
            room_id WITH =,
            daterange(check_in, check_out, '[)') WITH &&
        )
        WHERE (status IN ('confirmed', 'checked_in'))
        """
    )


def downgrade() -> None:
    op.execute(
        """
        ALTER TABLE bookings
        DROP CONSTRAINT IF EXISTS bookings_no_overlapping_active_room_stays
        """
    )
