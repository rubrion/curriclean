"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-05-21

"""

from collections.abc import Sequence

import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "applications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("company", sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column("title", sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("applied_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "saved",
                "applied",
                "interviewing",
                "offer",
                "rejected",
                "withdrawn",
                name="applicationstatus",
            ),
            nullable=False,
        ),
        sa.Column("analysis", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "analysis_hash",
            sqlmodel.sql.sqltypes.AutoString(length=64),
            nullable=True,
        ),
        sa.Column("analysis_updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_applications_company", "applications", ["company"])
    op.create_index("ix_applications_status", "applications", ["status"])
    op.create_index("ix_applications_analysis_hash", "applications", ["analysis_hash"])


def downgrade() -> None:
    op.drop_index("ix_applications_analysis_hash", table_name="applications")
    op.drop_index("ix_applications_status", table_name="applications")
    op.drop_index("ix_applications_company", table_name="applications")
    op.drop_table("applications")
    sa.Enum(name="applicationstatus").drop(op.get_bind(), checkfirst=True)
