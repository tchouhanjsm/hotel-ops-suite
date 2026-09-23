"""create service vouchers

Revision ID: c9d7a1e4f2b6
Revises: 8c2f6d4a91b7
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "c9d7a1e4f2b6"
down_revision: str | Sequence[str] | None = "8c2f6d4a91b7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "service_vouchers",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("voucher_number", sa.String(length=30), nullable=False),
        sa.Column("voucher_date", sa.Date(), nullable=False),
        sa.Column("folio_id", sa.Integer(), nullable=False),
        sa.Column("folio_item_id", sa.Integer(), nullable=True),
        sa.Column("service_category", sa.String(length=100), nullable=False),
        sa.Column("service_name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("quantity", sa.Numeric(10, 2), nullable=False),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("tax_percent", sa.Numeric(5, 2), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("tax_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_by", sa.Integer(), nullable=False),
        sa.Column("issued_by", sa.Integer(), nullable=True),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancelled_by", sa.Integer(), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["folio_id"], ["folios.id"]),
        sa.ForeignKeyConstraint(["folio_item_id"], ["folio_items.id"]),
        sa.ForeignKeyConstraint(["created_by"], ["staff.id"]),
        sa.ForeignKeyConstraint(["issued_by"], ["staff.id"]),
        sa.ForeignKeyConstraint(["cancelled_by"], ["staff.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_service_vouchers_voucher_number",
        "service_vouchers",
        ["voucher_number"],
        unique=True,
    )
    op.create_index(
        "ix_service_vouchers_folio_id",
        "service_vouchers",
        ["folio_id"],
        unique=False,
    )
    op.create_index(
        "uq_service_vouchers_folio_item_id",
        "service_vouchers",
        ["folio_item_id"],
        unique=True,
    )
    op.create_index(
        "ix_service_vouchers_status",
        "service_vouchers",
        ["status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_service_vouchers_status", table_name="service_vouchers")
    op.drop_index(
        "uq_service_vouchers_folio_item_id",
        table_name="service_vouchers",
    )
    op.drop_index("ix_service_vouchers_folio_id", table_name="service_vouchers")
    op.drop_index(
        "ix_service_vouchers_voucher_number",
        table_name="service_vouchers",
    )
    op.drop_table("service_vouchers")
