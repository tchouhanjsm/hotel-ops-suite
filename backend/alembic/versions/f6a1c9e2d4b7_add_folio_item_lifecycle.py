"""add folio item lifecycle

Revision ID: f6a1c9e2d4b7
Revises: c9d7a1e4f2b6
"""

import sqlalchemy as sa

from alembic import op

revision = "f6a1c9e2d4b7"
down_revision = "c9d7a1e4f2b6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("folio_items") as batch_op:
        batch_op.add_column(
            sa.Column(
                "status",
                sa.String(length=20),
                nullable=False,
                server_default="active",
            )
        )
        batch_op.add_column(
            sa.Column(
                "voided_at",
                sa.DateTime(timezone=True),
                nullable=True,
            )
        )
        batch_op.add_column(
            sa.Column(
                "voided_by",
                sa.Integer(),
                nullable=True,
            )
        )
        batch_op.create_foreign_key(
            "fk_folio_items_voided_by_staff",
            "staff",
            ["voided_by"],
            ["id"],
        )
        batch_op.create_index(
            "ix_folio_items_status",
            ["status"],
        )

    op.alter_column(
        "folio_items",
        "status",
        server_default=None,
    )


def downgrade() -> None:
    with op.batch_alter_table("folio_items") as batch_op:
        batch_op.drop_index("ix_folio_items_status")
        batch_op.drop_constraint(
            "fk_folio_items_voided_by_staff",
            type_="foreignkey",
        )
        batch_op.drop_column("voided_by")
        batch_op.drop_column("voided_at")
        batch_op.drop_column("status")
