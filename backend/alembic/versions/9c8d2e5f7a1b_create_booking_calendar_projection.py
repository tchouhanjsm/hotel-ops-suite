import sqlalchemy as sa

from alembic import op

revision = "9c8d2e5f7a1b"
down_revision = "9b7c1d4e2f6a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "booking_calendar_projection",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("booking_id", sa.Integer(), nullable=False),
        sa.Column("booking_reference", sa.String(length=50), nullable=False),
        sa.Column("guest_id", sa.Integer(), nullable=False),
        sa.Column("room_id", sa.Integer(), nullable=False),
        sa.Column("check_in", sa.Date(), nullable=False),
        sa.Column("check_out", sa.Date(), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("booking_id"),
    )

    op.create_index(
        "ix_booking_calendar_projection_booking_id",
        "booking_calendar_projection",
        ["booking_id"],
    )
    op.create_index(
        "ix_booking_calendar_projection_booking_reference",
        "booking_calendar_projection",
        ["booking_reference"],
    )
    op.create_index(
        "ix_booking_calendar_projection_guest_id",
        "booking_calendar_projection",
        ["guest_id"],
    )
    op.create_index(
        "ix_booking_calendar_projection_room_id",
        "booking_calendar_projection",
        ["room_id"],
    )
    op.create_index(
        "ix_booking_calendar_projection_status",
        "booking_calendar_projection",
        ["status"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_booking_calendar_projection_status",
        table_name="booking_calendar_projection",
    )
    op.drop_index(
        "ix_booking_calendar_projection_room_id",
        table_name="booking_calendar_projection",
    )
    op.drop_index(
        "ix_booking_calendar_projection_guest_id",
        table_name="booking_calendar_projection",
    )
    op.drop_index(
        "ix_booking_calendar_projection_booking_reference",
        table_name="booking_calendar_projection",
    )
    op.drop_index(
        "ix_booking_calendar_projection_booking_id",
        table_name="booking_calendar_projection",
    )
    op.drop_table("booking_calendar_projection")
