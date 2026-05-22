from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.config import get_settings
from app.database import get_session
from app.models import Application, User
from app.schemas import SuggestedProfilesResponse
from app.services import brave

router = APIRouter(prefix="/applications", tags=["suggestions"])


@router.post(
    "/{application_id}/suggested-profiles",
    response_model=SuggestedProfilesResponse,
)
async def suggested_profiles(
    application_id: UUID,
    limit: int = Query(default=10, ge=1, le=20),
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> SuggestedProfilesResponse:
    if not get_settings().BRAVE_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="BRAVE_NOT_CONFIGURED",
        )

    app = await session.get(Application, application_id)
    if app is None or app.user_id != user.id:
        raise HTTPException(status_code=404, detail="Application not found")

    hits = await brave.search_linkedin_profiles(
        job_title=app.title,
        company=app.company,
        limit=limit,
    )
    return SuggestedProfilesResponse(hits=hits)
