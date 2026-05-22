from datetime import UTC, date, datetime
from decimal import Decimal
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import Column, Date, DateTime, ForeignKey, Numeric, Text, UniqueConstraint
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlmodel import Field, SQLModel


class ApplicationStatus(StrEnum):
    SAVED = "saved"
    APPLIED = "applied"
    INTERVIEWING = "interviewing"
    OFFER = "offer"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


def _utcnow() -> datetime:
    return datetime.now(UTC)


class User(SQLModel, table=True):
    __tablename__ = "users"  # type: ignore[assignment]

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    email: str = Field(max_length=320, unique=True, index=True)
    email_verified: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
    )
    password_hash: str | None = Field(default=None, max_length=255)
    name: str | None = Field(default=None, max_length=255)
    image: str | None = Field(default=None, sa_column=Column(Text, nullable=True))
    created_at: datetime = Field(
        default_factory=_utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    updated_at: datetime = Field(
        default_factory=_utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )


class TokenUsage(SQLModel, table=True):
    __tablename__ = "token_usage"  # type: ignore[assignment]
    __table_args__ = (UniqueConstraint("user_id", "day", name="uq_token_usage_user_day"),)

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
    )
    day: date = Field(sa_column=Column(Date, nullable=False, index=True))
    tokens_in: int = Field(default=0)
    tokens_out: int = Field(default=0)
    cost_usd: Decimal = Field(
        default=Decimal("0"),
        sa_column=Column(Numeric(10, 6), nullable=False),
    )
    created_at: datetime = Field(
        default_factory=_utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    updated_at: datetime = Field(
        default_factory=_utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )


class Application(SQLModel, table=True):
    __tablename__ = "applications"  # type: ignore[assignment]

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
    )
    company: str = Field(max_length=255, index=True)
    title: str = Field(max_length=255)
    description: str = Field(sa_column=Column(Text, nullable=False))
    applied_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    status: ApplicationStatus = Field(
        default=ApplicationStatus.SAVED,
        sa_column=Column(
            SAEnum(
                ApplicationStatus,
                name="applicationstatus",
                values_callable=lambda e: [m.value for m in e],
            ),
            nullable=False,
            index=True,
        ),
    )
    analysis: dict | None = Field(
        default=None,
        sa_column=Column(JSONB, nullable=True),
    )
    analysis_hash: str | None = Field(default=None, max_length=64, index=True)
    analysis_updated_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
    )
    created_at: datetime = Field(
        default_factory=_utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    updated_at: datetime = Field(
        default_factory=_utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )


class VerificationToken(SQLModel, table=True):
    __tablename__ = "verification_tokens"  # type: ignore[assignment]

    identifier: str = Field(primary_key=True, max_length=320)
    token: str = Field(primary_key=True, max_length=128)
    expires: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False))
