from datetime import UTC, datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import Column, DateTime, Text
from sqlalchemy.dialects.postgresql import JSONB
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


class Application(SQLModel, table=True):
    __tablename__ = "applications"  # type: ignore[assignment]

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    company: str = Field(max_length=255, index=True)
    title: str = Field(max_length=255)
    description: str = Field(sa_column=Column(Text, nullable=False))
    applied_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    status: ApplicationStatus = Field(
        default=ApplicationStatus.SAVED,
        index=True,
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
