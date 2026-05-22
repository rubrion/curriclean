from __future__ import annotations

import re
from time import perf_counter

import httpx
import logfire

from app.config import get_settings
from app.schemas import ProfileHit

_LINKEDIN_PROFILE_RE = re.compile(r"^https://(?:www\.)?linkedin\.com/in/[^/]+/?$")


def _build_query(job_title: str, company: str) -> str:
    parts = ["site:linkedin.com/in"]
    if job_title:
        parts.append(f'"{job_title}"')
    if company:
        parts.append(f'"{company}"')
    return " ".join(parts)


async def search_linkedin_profiles(
    job_title: str,
    company: str,
    limit: int = 10,
) -> list[ProfileHit]:
    settings = get_settings()
    if not settings.BRAVE_API_KEY:
        return []

    query = _build_query(job_title, company)
    count = max(limit * 2, limit)

    with logfire.span(
        "brave.search",
        query=query,
        limit=limit,
    ) as span:
        started = perf_counter()
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                settings.BRAVE_SEARCH_URL,
                params={"q": query, "count": count},
                headers={
                    "X-Subscription-Token": settings.BRAVE_API_KEY,
                    "Accept": "application/json",
                },
            )
        latency_ms = int((perf_counter() - started) * 1000)
        span.set_attribute("latency_ms", latency_ms)
        span.set_attribute("status_code", response.status_code)

        response.raise_for_status()
        body = response.json()

        web = body.get("web") or {}
        results = web.get("results") or []

        hits: list[ProfileHit] = []
        for r in results:
            url = (r.get("url") or "").strip()
            if not _LINKEDIN_PROFILE_RE.match(url):
                continue
            hits.append(
                ProfileHit(
                    url=url,
                    title=(r.get("title") or "").strip(),
                    description=(r.get("description") or "").strip(),
                )
            )
            if len(hits) >= limit:
                break

        span.set_attribute("hit_count", len(hits))
        return hits
