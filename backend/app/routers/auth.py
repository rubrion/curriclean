from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.config import get_settings
from app.database import get_session
from app.models import User
from app.services import tokens
from app.services.email import send_password_reset_email, send_verify_email
from app.services.passwords import hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=200)
    name: str | None = Field(default=None, max_length=255)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class VerifyIn(BaseModel):
    token: str


class ForgotIn(BaseModel):
    email: EmailStr


class ResetIn(BaseModel):
    token: str
    password: str = Field(min_length=8, max_length=200)


class OAuthUpsertIn(BaseModel):
    email: EmailStr
    name: str | None = None
    image: str | None = None


class UserOut(BaseModel):
    id: UUID
    email: str
    name: str | None
    email_verified: bool


def _user_to_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        email=user.email,
        name=user.name,
        email_verified=user.email_verified is not None,
    )


def _require_shared_secret(provided: str | None) -> None:
    expected = get_settings().AUTH_SHARED_SECRET
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AUTH_SHARED_SECRET not configured",
        )
    if not provided or not _consteq(provided, expected):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid shared secret")


def _consteq(a: str, b: str) -> bool:
    if len(a) != len(b):
        return False
    diff = 0
    for x, y in zip(a, b, strict=False):
        diff |= ord(x) ^ ord(y)
    return diff == 0


async def _get_user_by_email(session: AsyncSession, email: str) -> User | None:
    email = email.lower()
    result = await session.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterIn,
    session: AsyncSession = Depends(get_session),
) -> dict:
    email = payload.email.lower()
    existing = await _get_user_by_email(session, email)
    if existing is not None:
        if existing.email_verified is None:
            token = await tokens.mint(session, tokens.VERIFY_PREFIX, email)
            verify_url = f"{get_settings().FRONTEND_BASE_URL.rstrip('/')}/verify?token={token}"
            send_verify_email(email, verify_url)
        return {"status": "ok"}

    user = User(
        email=email,
        name=payload.name,
        password_hash=hash_password(payload.password),
        email_verified=None,
    )
    session.add(user)
    await session.commit()

    token = await tokens.mint(session, tokens.VERIFY_PREFIX, email)
    verify_url = f"{get_settings().FRONTEND_BASE_URL.rstrip('/')}/verify?token={token}"
    send_verify_email(email, verify_url)
    return {"status": "ok"}


@router.post("/verify")
async def verify(
    payload: VerifyIn,
    session: AsyncSession = Depends(get_session),
) -> dict:
    email = await tokens.consume(session, tokens.VERIFY_PREFIX, payload.token)
    if email is None:
        raise HTTPException(status_code=400, detail="INVALID_OR_EXPIRED_TOKEN")
    user = await _get_user_by_email(session, email)
    if user is None:
        raise HTTPException(status_code=400, detail="USER_NOT_FOUND")
    user.email_verified = datetime.now(UTC)
    user.updated_at = datetime.now(UTC)
    session.add(user)
    await session.commit()
    return {"status": "ok"}


@router.post("/login", response_model=UserOut)
async def login(
    payload: LoginIn,
    session: AsyncSession = Depends(get_session),
) -> UserOut:
    user = await _get_user_by_email(session, payload.email)
    if user is None or not user.password_hash:
        raise HTTPException(status_code=401, detail="INVALID_CREDENTIALS")
    if user.email_verified is None:
        raise HTTPException(status_code=403, detail="EMAIL_NOT_VERIFIED")
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="INVALID_CREDENTIALS")
    return _user_to_out(user)


@router.post("/forgot")
async def forgot(
    payload: ForgotIn,
    session: AsyncSession = Depends(get_session),
) -> dict:
    user = await _get_user_by_email(session, payload.email)
    if user is not None and user.email_verified is not None:
        token = await tokens.mint(session, tokens.RESET_PREFIX, payload.email.lower())
        reset_url = f"{get_settings().FRONTEND_BASE_URL.rstrip('/')}/reset?token={token}"
        send_password_reset_email(payload.email.lower(), reset_url)
    return {"status": "ok"}


@router.post("/reset")
async def reset(
    payload: ResetIn,
    session: AsyncSession = Depends(get_session),
) -> dict:
    email = await tokens.consume(session, tokens.RESET_PREFIX, payload.token)
    if email is None:
        raise HTTPException(status_code=400, detail="INVALID_OR_EXPIRED_TOKEN")
    user = await _get_user_by_email(session, email)
    if user is None:
        raise HTTPException(status_code=400, detail="USER_NOT_FOUND")
    user.password_hash = hash_password(payload.password)
    user.updated_at = datetime.now(UTC)
    session.add(user)
    await session.commit()
    return {"status": "ok"}


@router.post("/oauth-upsert", response_model=UserOut)
async def oauth_upsert(
    payload: OAuthUpsertIn,
    x_auth_secret: str | None = Header(default=None),
    session: AsyncSession = Depends(get_session),
) -> UserOut:
    _require_shared_secret(x_auth_secret)

    email = payload.email.lower()
    user = await _get_user_by_email(session, email)
    if user is None:
        user = User(
            email=email,
            name=payload.name,
            image=payload.image,
            email_verified=datetime.now(UTC),
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
    else:
        if user.email_verified is None:
            user.email_verified = datetime.now(UTC)
        if payload.name and not user.name:
            user.name = payload.name
        if payload.image and not user.image:
            user.image = payload.image
        user.updated_at = datetime.now(UTC)
        session.add(user)
        await session.commit()
        await session.refresh(user)
    return _user_to_out(user)
