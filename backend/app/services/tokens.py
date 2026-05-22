from __future__ import annotations

import secrets
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, select

from app.models import VerificationToken

VERIFY_PREFIX = "verify:"
RESET_PREFIX = "reset:"
DEFAULT_TTL = timedelta(hours=1)


def _identifier(prefix: str, email: str) -> str:
    return f"{prefix}{email.lower()}"


async def mint(
    session: AsyncSession,
    prefix: str,
    email: str,
    ttl: timedelta = DEFAULT_TTL,
) -> str:
    identifier = _identifier(prefix, email)
    await session.execute(
        delete(VerificationToken).where(col(VerificationToken.identifier) == identifier)
    )
    token = secrets.token_urlsafe(48)
    expires = datetime.now(UTC) + ttl
    row = VerificationToken(identifier=identifier, token=token, expires=expires)
    session.add(row)
    await session.commit()
    return token


async def consume(
    session: AsyncSession,
    prefix: str,
    token: str,
) -> str | None:
    """Validate token and return the associated email, or None if invalid/expired."""
    result = await session.execute(
        select(VerificationToken).where(col(VerificationToken.token) == token)
    )
    row = result.scalar_one_or_none()
    if row is None:
        return None
    if not row.identifier.startswith(prefix):
        return None
    expires = row.expires.replace(tzinfo=UTC) if row.expires.tzinfo is None else row.expires
    if expires < datetime.now(UTC):
        await session.execute(
            delete(VerificationToken).where(
                col(VerificationToken.identifier) == row.identifier,
                col(VerificationToken.token) == row.token,
            )
        )
        await session.commit()
        return None

    email = row.identifier[len(prefix) :]
    await session.execute(
        delete(VerificationToken).where(
            col(VerificationToken.identifier) == row.identifier,
            col(VerificationToken.token) == row.token,
        )
    )
    await session.commit()
    return email
