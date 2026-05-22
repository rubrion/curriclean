"""auth + budget tables, backfill user_id on applications

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-21

"""

from collections.abc import Sequence

import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

DEMO_EMAIL = "demo@specfit.dev"


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("email", sqlmodel.sql.sqltypes.AutoString(length=320), nullable=False),
        sa.Column("email_verified", sa.DateTime(timezone=True), nullable=True),
        sa.Column("password_hash", sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
        sa.Column("name", sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
        sa.Column("image", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_unique_constraint("uq_users_email", "users", ["email"])
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "verification_tokens",
        sa.Column("identifier", sqlmodel.sql.sqltypes.AutoString(length=320), nullable=False),
        sa.Column("token", sqlmodel.sql.sqltypes.AutoString(length=128), nullable=False),
        sa.Column("expires", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("identifier", "token"),
    )

    op.create_table(
        "token_usage",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("day", sa.Date(), nullable=False),
        sa.Column("tokens_in", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("tokens_out", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "cost_usd",
            sa.Numeric(10, 6),
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", "day", name="uq_token_usage_user_day"),
    )
    op.create_index("ix_token_usage_user_id", "token_usage", ["user_id"])
    op.create_index("ix_token_usage_day", "token_usage", ["day"])

    op.add_column(
        "applications",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
    )

    op.execute(
        sa.text(
            "INSERT INTO users (email, email_verified) VALUES (:email, now()) "
            "ON CONFLICT (email) DO NOTHING"
        ).bindparams(email=DEMO_EMAIL)
    )
    op.execute(
        sa.text(
            "UPDATE applications SET user_id = (SELECT id FROM users WHERE email = :email) "
            "WHERE user_id IS NULL"
        ).bindparams(email=DEMO_EMAIL)
    )

    op.alter_column("applications", "user_id", nullable=False)
    op.create_foreign_key(
        "fk_applications_user_id",
        "applications",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index("ix_applications_user_id", "applications", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_applications_user_id", table_name="applications")
    op.drop_constraint("fk_applications_user_id", "applications", type_="foreignkey")
    op.drop_column("applications", "user_id")

    op.drop_index("ix_token_usage_day", table_name="token_usage")
    op.drop_index("ix_token_usage_user_id", table_name="token_usage")
    op.drop_table("token_usage")

    op.drop_table("verification_tokens")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_constraint("uq_users_email", "users", type_="unique")
    op.drop_table("users")
