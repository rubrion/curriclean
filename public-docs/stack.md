# Stack

## Backend (`backend/`)

- **Language**: Python 3.12
- **Framework**: FastAPI (async)
- **ORM**: SQLModel on SQLAlchemy 2 async
- **Migrations**: Alembic (real migration files; no metadata auto-create)
- **DB drivers**: `asyncpg` (runtime), `psycopg[binary]` (migrations)
- **Auth**: own credentials store with `bcrypt` hashes, verify/reset tokens via `verification_tokens` table, OAuth upsert endpoint
- **Bearer**: HS256 JWT (`PyJWT`) minted by the web client and verified by every request
- **Email**: Resend SDK
- **LLM client**: [`pydantic-ai`](https://ai.pydantic.dev) with `OpenAIModel` + `OpenAIProvider` pointed at OpenRouter
- **Caching**: SHA256 hash of `(model, job_description, cv_text)` against `Application.analysis_hash`; bypass with `?force=true`
- **Budget**: per-user daily token cap in `token_usage`; over-cap returns `429 DAILY_TOKEN_LIMIT`
- **Tracing**: Logfire instrumentation for FastAPI, SQLAlchemy, httpx, pydantic-ai
- **Lint / typecheck / test**: `ruff`, `pyright`, `pytest`
- **Container**: `python:3.12-slim`, `boot.sh` runs `alembic upgrade head` then `uvicorn`

## Frontend (`web-client/`)

- **Framework**: Next.js 16 (App Router)
- **Runtime**: React 19
- **Auth**: [Auth.js v5 (NextAuth)](https://authjs.dev) with Credentials + Google + GitHub providers, JWT session strategy
- **Token mint**: `jose` HS256 — every session carries a 15-minute bearer that the FastAPI backend validates
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript (strict)
- **Deploy adapter**: `@opennextjs/cloudflare` → Cloudflare Workers
- **Theme**: High-Contrast Minimalist (Deep Black `#09090B`, White `#FFFFFF`, Slate `#64748B`)
- **Typography**: Geist Sans (UI) / Geist Mono (LLM output, metrics)
