import hashlib
import time
from dataclasses import dataclass

import logfire
from openai import AsyncOpenAI
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.providers.openai import OpenAIProvider

from app.config import get_settings
from app.schemas import MatchAnalysis

# OpenRouter pricing (USD per million tokens). Conservative defaults; override per-model.
_PRICING: dict[str, tuple[float, float]] = {
    "openai/gpt-4o-mini": (0.15, 0.60),
    "openai/gpt-4o": (2.50, 10.00),
    "anthropic/claude-3.5-sonnet": (3.00, 15.00),
    "anthropic/claude-3.5-haiku": (0.80, 4.00),
    "google/gemini-2.0-flash-001": (0.10, 0.40),
    "meta-llama/llama-3.3-70b-instruct": (0.13, 0.40),
}


@dataclass
class AnalysisResult:
    analysis: MatchAnalysis
    model: str
    tokens_in: int
    tokens_out: int
    latency_ms: int
    cost_estimate_usd: float


SYSTEM_PROMPT = (
    "You are a senior technical recruiter. Given a job description and a candidate CV, "
    "produce a structured match analysis. Be honest, specific, and concise.\n\n"
    "Scoring rubric (0-100):\n"
    "- 90+: outstanding fit, every must-have covered with strong evidence.\n"
    "- 75-89: strong fit, all must-haves covered, minor gaps in nice-to-haves.\n"
    "- 60-74: solid fit, most must-haves covered, some real gaps.\n"
    "- 40-59: partial fit, several must-haves missing.\n"
    "- <40: weak fit.\n\n"
    "Always return: score, summary (1-2 sentences), 3-6 strengths, 3-6 gaps, "
    "4-6 interview questions tailored to probe the gaps."
)


def compute_cache_key(job_description: str, cv_text: str, model: str) -> str:
    payload = f"{model}\x1f{job_description}\x1f{cv_text}".encode()
    return hashlib.sha256(payload).hexdigest()


def estimate_cost(model: str, tokens_in: int, tokens_out: int) -> float:
    rate_in, rate_out = _PRICING.get(model, (0.0, 0.0))
    return round((tokens_in * rate_in + tokens_out * rate_out) / 1_000_000, 6)


def _build_agent() -> Agent[None, MatchAnalysis]:
    settings = get_settings()
    if not settings.OPENROUTER_API_KEY:
        raise RuntimeError("OPENROUTER_API_KEY not configured")

    client = AsyncOpenAI(
        api_key=settings.OPENROUTER_API_KEY,
        base_url=settings.OPENROUTER_BASE_URL,
    )
    provider = OpenAIProvider(openai_client=client)
    model = OpenAIModel(settings.OPENROUTER_MODEL, provider=provider)
    return Agent(
        model=model,
        output_type=MatchAnalysis,
        system_prompt=SYSTEM_PROMPT,
    )


async def run_analysis(job_description: str, cv_text: str) -> AnalysisResult:
    settings = get_settings()
    agent = _build_agent()

    user_prompt = (
        f"JOB DESCRIPTION:\n{job_description}\n\n"
        f"CANDIDATE CV:\n{cv_text}\n\n"
        "Return the structured match analysis."
    )

    with logfire.span("llm.match_analysis", model=settings.OPENROUTER_MODEL):
        started = time.perf_counter()
        result = await agent.run(user_prompt)
        latency_ms = int((time.perf_counter() - started) * 1000)

    usage = result.usage()
    tokens_in = usage.request_tokens or 0
    tokens_out = usage.response_tokens or 0
    cost = estimate_cost(settings.OPENROUTER_MODEL, tokens_in, tokens_out)

    return AnalysisResult(
        analysis=result.output,
        model=settings.OPENROUTER_MODEL,
        tokens_in=tokens_in,
        tokens_out=tokens_out,
        latency_ms=latency_ms,
        cost_estimate_usd=cost,
    )
