from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models import ApplicationStatus


class ApplicationCreate(BaseModel):
    company: str = Field(min_length=1, max_length=255)
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    applied_at: datetime
    status: ApplicationStatus = ApplicationStatus.SAVED


class ApplicationUpdate(BaseModel):
    company: str | None = Field(default=None, min_length=1, max_length=255)
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, min_length=1)
    applied_at: datetime | None = None
    status: ApplicationStatus | None = None


class ApplicationRead(BaseModel):
    id: UUID
    company: str
    title: str
    description: str
    applied_at: datetime
    status: ApplicationStatus
    analysis: dict | None
    analysis_hash: str | None
    analysis_updated_at: datetime | None
    created_at: datetime
    updated_at: datetime


class MatchRequest(BaseModel):
    cv_text: str = Field(min_length=1)


class MatchMetrics(BaseModel):
    model: str
    tokens_in: int
    tokens_out: int
    latency_ms: int
    cost_estimate_usd: float
    cached: bool
    cache_key: str


class MatchAnalysis(BaseModel):
    score: int = Field(ge=0, le=100)
    summary: str
    strengths: list[str]
    gaps: list[str]
    interview_questions: list[str]


class MatchResponse(BaseModel):
    application_id: UUID
    analysis: MatchAnalysis
    metrics: MatchMetrics
    updated_at: datetime


class CvParseResponse(BaseModel):
    text: str


class ProfileHit(BaseModel):
    url: str
    title: str
    description: str


class SuggestedProfilesResponse(BaseModel):
    hits: list[ProfileHit]
