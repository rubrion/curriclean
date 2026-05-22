from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.config import get_settings
from app.models import TokenUsage


async def get_used_today(session: AsyncSession, user_id: UUID) -> int:
    today = datetime.now(UTC).date()
    result = await session.execute(
        select(TokenUsage).where(
            TokenUsage.user_id == user_id,
            TokenUsage.day == today,
        )
    )
    row = result.scalar_one_or_none()
    if row is None:
        return 0
    return row.tokens_in + row.tokens_out


async def assert_under_cap(session: AsyncSession, user_id: UUID) -> None:
    settings = get_settings()
    used = await get_used_today(session, user_id)
    if used >= settings.DAILY_TOKEN_BUDGET:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="DAILY_TOKEN_LIMIT",
        )


async def record_usage(
    session: AsyncSession,
    user_id: UUID,
    tokens_in: int,
    tokens_out: int,
    cost_usd: float,
) -> None:
    today = datetime.now(UTC).date()
    now = datetime.now(UTC)

    stmt = pg_insert(TokenUsage).values(
        user_id=user_id,
        day=today,
        tokens_in=tokens_in,
        tokens_out=tokens_out,
        cost_usd=Decimal(str(cost_usd)),
        created_at=now,
        updated_at=now,
    )
    stmt = stmt.on_conflict_do_update(
        constraint="uq_token_usage_user_day",
        set_={
            "tokens_in": TokenUsage.tokens_in + tokens_in,
            "tokens_out": TokenUsage.tokens_out + tokens_out,
            "cost_usd": TokenUsage.cost_usd + Decimal(str(cost_usd)),
            "updated_at": now,
        },
    )
    await session.execute(stmt)
    await session.commit()
