"""create invoices

Revision ID: 71b7a17e2c31
Revises: 4425eb89c29a
Create Date: 2026-09-19
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "71b7a17e2c31"
down_revision: str | Sequence[str] | None = "4425eb89c29a"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "invoices",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("invoice_number", sa.String(length=30), nullable=False),
        sa.Column("folio_id", sa.Integer(), nullable=False),
        sa.Column("booking_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("bill_to_name", sa.String(length=200), nullable=False),
        sa.Column("bill_to_phone", sa.String(length=30), nullable=False),
        sa.Column("bill_to_email", sa.String(length=255), nullable=True),
        sa.Column("bill_to_address", sa.Text(), nullable=True),
        sa.Column("booking_reference", sa.String(length=30), nullable=False),
        sa.Column("room_number", sa.String(length=50), nullable=False),
        sa.Column("check_in", sa.Date(), nullable=False),
        sa.Column("check_out", sa.Date(), nullable=False),
        sa.Column("subtotal", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("tax_total", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("grand_total", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("paid_amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("balance_due", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("finalized_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finalized_by", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["booking_id"], ["bookings.id"]),
        sa.ForeignKeyConstraint(["finalized_by"], ["staff.id"]),
        sa.ForeignKeyConstraint(["folio_id"], ["folios.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_invoices_invoice_number",
        "invoices",
        ["invoice_number"],
        unique=True,
    )
    op.create_index(
        "ix_invoices_folio_id",
        "invoices",
        ["folio_id"],
        unique=False,
    )
    op.create_index(
        "ix_invoices_booking_id",
        "invoices",
        ["booking_id"],
        unique=False,
    )
    op.create_index(
        "uq_invoices_active_folio",
        "invoices",
        ["folio_id"],
        unique=True,
        sqlite_where=sa.text("status != 'void'"),
        postgresql_where=sa.text("status != 'void'"),
    )

    op.create_table(
        "invoice_items",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("invoice_id", sa.Integer(), nullable=False),
        sa.Column("folio_item_id", sa.Integer(), nullable=True),
        sa.Column("item_type", sa.String(length=30), nullable=False),
        sa.Column("description", sa.String(length=200), nullable=False),
        sa.Column("quantity", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("unit_price", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("tax_percent", sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("tax_amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column(
            "total_amount",
            sa.Numeric(precision=12, scale=2),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["folio_item_id"], ["folio_items.id"]),
        sa.ForeignKeyConstraint(["invoice_id"], ["invoices.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_invoice_items_invoice_id",
        "invoice_items",
        ["invoice_id"],
        unique=False,
    )
    op.create_index(
        "ix_invoice_items_folio_item_id",
        "invoice_items",
        ["folio_item_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_invoice_items_folio_item_id", table_name="invoice_items")
    op.drop_index("ix_invoice_items_invoice_id", table_name="invoice_items")
    op.drop_table("invoice_items")

    op.drop_index("uq_invoices_active_folio", table_name="invoices")
    op.drop_index("ix_invoices_booking_id", table_name="invoices")
    op.drop_index("ix_invoices_folio_id", table_name="invoices")
    op.drop_index("ix_invoices_invoice_number", table_name="invoices")
    op.drop_table("invoices")
