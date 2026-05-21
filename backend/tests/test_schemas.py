import pytest
from pydantic import ValidationError

from app.schemas import MatchAnalysis, MatchMetrics


def test_match_analysis_score_bounds() -> None:
    with pytest.raises(ValidationError):
        MatchAnalysis(score=101, summary="x", strengths=[], gaps=[], interview_questions=[])
    with pytest.raises(ValidationError):
        MatchAnalysis(score=-1, summary="x", strengths=[], gaps=[], interview_questions=[])


def test_match_metrics_round_trip() -> None:
    m = MatchMetrics(
        model="m",
        tokens_in=10,
        tokens_out=20,
        latency_ms=100,
        cost_estimate_usd=0.001,
        cached=False,
        cache_key="a" * 64,
    )
    assert m.model_dump()["cache_key"] == "a" * 64
