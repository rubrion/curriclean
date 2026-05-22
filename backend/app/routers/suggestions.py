from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

import logfire
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.config import get_settings
from app.database import get_session
from app.models import Application, User
from app.schemas import ProfileHit, SuggestedProfilesResponse
from app.services import brave

router = APIRouter(prefix="/applications", tags=["suggestions"])


def _hits_from_cache(stored: dict) -> list[ProfileHit]:
    raw = stored.get("hits") or []
    return [ProfileHit.model_validate(h) for h in raw]


@router.post(
    "/{application_id}/suggested-profiles",
    response_model=SuggestedProfilesResponse,
)
async def suggested_profiles(
    application_id: UUID,
    refresh: bool = Query(default=False),
    limit: int = Query(default=10, ge=1, le=20),
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> SuggestedProfilesResponse:
    app = await session.get(Application, application_id)
    if app is None or app.user_id != user.id:
        raise HTTPException(status_code=404, detail="Application not found")

    cached = app.suggested_profiles if isinstance(app.suggested_profiles, dict) else None

    if not refresh and cached is not None:
        return SuggestedProfilesResponse(hits=_hits_from_cache(cached))

    if not get_settings().BRAVE_API_KEY:
        if cached is not None:
            return SuggestedProfilesResponse(hits=_hits_from_cache(cached))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="BRAVE_NOT_CONFIGURED",
        )

    try:
        hits = await brave.search_linkedin_profiles(
            job_title=app.title,
            company=app.company,
            limit=limit,
        )
    except Exception as exc:
        logfire.error(
            "brave.fetch_failed",
            application_id=str(application_id),
            error=str(exc),
        )
        if cached is not None:
            return SuggestedProfilesResponse(hits=_hits_from_cache(cached))
        raise HTTPException(status_code=502, detail="BRAVE_FETCH_FAILED") from exc

    now = datetime.now(UTC)
    app.suggested_profiles = {"hits": [h.model_dump() for h in hits]}
    app.suggested_profiles_updated_at = now
    app.updated_at = now
    session.add(app)
    await session.commit()

    return SuggestedProfilesResponse(hits=hits)
