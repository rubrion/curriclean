from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, select

from app.auth import get_current_user
from app.database import get_session
from app.models import Application, ApplicationStatus, User
from app.schemas import ApplicationCreate, ApplicationRead, ApplicationUpdate

router = APIRouter(prefix="/applications", tags=["applications"])


def _to_read(app: Application) -> ApplicationRead:
    return ApplicationRead(
        id=app.id,
        company=app.company,
        title=app.title,
        description=app.description,
        applied_at=app.applied_at,
        status=app.status,
        analysis=app.analysis,
        analysis_hash=app.analysis_hash,
        analysis_updated_at=app.analysis_updated_at,
        created_at=app.created_at,
        updated_at=app.updated_at,
    )


@router.post("", response_model=ApplicationRead, status_code=status.HTTP_201_CREATED)
async def create_application(
    payload: ApplicationCreate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> ApplicationRead:
    app = Application(
        user_id=user.id,
        company=payload.company,
        title=payload.title,
        description=payload.description,
        applied_at=payload.applied_at,
        status=payload.status,
    )
    session.add(app)
    await session.commit()
    await session.refresh(app)
    return _to_read(app)


@router.get("", response_model=list[ApplicationRead])
async def list_applications(
    status_filter: ApplicationStatus | None = Query(default=None, alias="status"),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[ApplicationRead]:
    stmt = (
        select(Application)
        .where(Application.user_id == user.id)
        .order_by(col(Application.created_at).desc())
    )
    if status_filter is not None:
        stmt = stmt.where(Application.status == status_filter)
    stmt = stmt.offset(offset).limit(limit)
    result = await session.execute(stmt)
    rows = result.scalars().all()
    return [_to_read(r) for r in rows]


async def _load_owned(session: AsyncSession, user: User, application_id: UUID) -> Application:
    app = await session.get(Application, application_id)
    if app is None or app.user_id != user.id:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


@router.get("/{application_id}", response_model=ApplicationRead)
async def get_application(
    application_id: UUID,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> ApplicationRead:
    app = await _load_owned(session, user, application_id)
    return _to_read(app)


@router.patch("/{application_id}", response_model=ApplicationRead)
async def update_application(
    application_id: UUID,
    payload: ApplicationUpdate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> ApplicationRead:
    app = await _load_owned(session, user, application_id)
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(app, k, v)
    app.updated_at = datetime.now(UTC)
    session.add(app)
    await session.commit()
    await session.refresh(app)
    return _to_read(app)


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(
    application_id: UUID,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> None:
    app = await _load_owned(session, user, application_id)
    await session.delete(app)
    await session.commit()
