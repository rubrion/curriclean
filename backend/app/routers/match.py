from datetime import UTC, datetime
from uuid import UUID

import logfire
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_session
from app.models import Application, User
from app.schemas import MatchAnalysis, MatchMetrics, MatchRequest, MatchResponse
from app.services import budget
from app.services.llm import compute_cache_key, run_analysis

router = APIRouter(prefix="/applications", tags=["match"])


@router.post("/{application_id}/match", response_model=MatchResponse)
async def match_application(
    application_id: UUID,
    payload: MatchRequest,
    force: bool = Query(default=False),
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> MatchResponse:
    app = await session.get(Application, application_id)
    if app is None or app.user_id != user.id:
        raise HTTPException(status_code=404, detail="Application not found")

    from app.config import get_settings

    settings = get_settings()
    cache_key = compute_cache_key(app.description, payload.cv_text, settings.OPENROUTER_MODEL)

    if not force and app.analysis_hash == cache_key and app.analysis is not None:
        with logfire.span("llm.cache_hit", application_id=str(application_id), cache_key=cache_key):
            cached_analysis = MatchAnalysis.model_validate(app.analysis["analysis"])
            cached_metrics = MatchMetrics.model_validate(
                {**app.analysis["metrics"], "cached": True, "cache_key": cache_key}
            )
            assert app.analysis_updated_at is not None
            return MatchResponse(
                application_id=app.id,
                analysis=cached_analysis,
                metrics=cached_metrics,
                updated_at=app.analysis_updated_at,
            )

    await budget.assert_under_cap(session, user.id)

    try:
        result = await run_analysis(app.description, payload.cv_text)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logfire.error("llm.match_failed", application_id=str(application_id), error=str(exc))
        raise HTTPException(status_code=502, detail="LLM analysis failed") from exc

    metrics = MatchMetrics(
        model=result.model,
        tokens_in=result.tokens_in,
        tokens_out=result.tokens_out,
        latency_ms=result.latency_ms,
        cost_estimate_usd=result.cost_estimate_usd,
        cached=False,
        cache_key=cache_key,
    )

    now = datetime.now(UTC)
    app.analysis = {
        "analysis": result.analysis.model_dump(),
        "metrics": metrics.model_dump(),
    }
    app.analysis_hash = cache_key
    app.analysis_updated_at = now
    app.updated_at = now
    session.add(app)
    await session.commit()
    await session.refresh(app)

    await budget.record_usage(
        session,
        user.id,
        tokens_in=result.tokens_in,
        tokens_out=result.tokens_out,
        cost_usd=result.cost_estimate_usd,
    )

    return MatchResponse(
        application_id=app.id,
        analysis=result.analysis,
        metrics=metrics,
        updated_at=now,
    )
