"""create cash vouchers

Revision ID: 8c2f6d4a91b7
Revises: 71b7a17e2c31
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "8c2f6d4a91b7"
down_revision: str | Sequence[str] | None = "71b7a17e2c31"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "cash_vouchers",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("voucher_number", sa.String(length=30), nullable=False),
        sa.Column("voucher_date", sa.Date(), nullable=False),
        sa.Column("payee_name", sa.String(length=200), nullable=False),
        sa.Column("expense_category", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("external_reference", sa.String(length=100), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_by", sa.Integer(), nullable=False),
        sa.Column("updated_by", sa.Integer(), nullable=True),
        sa.Column("cancelled_by", sa.Integer(), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["created_by"], ["staff.id"]),
        sa.ForeignKeyConstraint(["updated_by"], ["staff.id"]),
        sa.ForeignKeyConstraint(["cancelled_by"], ["staff.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_cash_vouchers_voucher_number"),
        "cash_vouchers",
        ["voucher_number"],
        unique=True,
    )
    op.create_index(
        op.f("ix_cash_vouchers_voucher_date"),
        "cash_vouchers",
        ["voucher_date"],
        unique=False,
    )
    op.create_index(
        op.f("ix_cash_vouchers_status"),
        "cash_vouchers",
        ["status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_cash_vouchers_status"), table_name="cash_vouchers")
    op.drop_index(op.f("ix_cash_vouchers_voucher_date"), table_name="cash_vouchers")
    op.drop_index(
        op.f("ix_cash_vouchers_voucher_number"),
        table_name="cash_vouchers",
    )
    op.drop_table("cash_vouchers")
