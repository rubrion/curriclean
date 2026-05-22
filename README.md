# SpecFit

Open-source job application tracker with LLM-powered CV matching.

Paste a job description and your CV. Get a structured fit score, matched skills, gaps, and a tailored recommendation. Track applications through their lifecycle. Sign in with email + password (with verification) or Google / GitHub OAuth. Every user gets an enforced daily LLM token budget.

## Platform

| Layer | Platform |
|-------|----------|
| Backend runtime | [Railway](https://railway.app) — Docker image, auto-injected `DATABASE_URL` |
| Database | Railway Postgres (PostgreSQL 16, `JSONB`) |
| Frontend runtime | [Cloudflare Workers](https://workers.cloudflare.com) via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) |
| LLM gateway | [OpenRouter](https://openrouter.ai) (default model `openai/gpt-4o-mini`) |
| Transactional email | [Resend](https://resend.com) (verify + password-reset) |
| Observability | [Pydantic Logfire](https://logfire.pydantic.dev) (SDK + MCP) |

## Stack

### Backend (`backend/`)

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

### Frontend (`web-client/`)

- **Framework**: Next.js 16 (App Router)
- **Runtime**: React 19
- **Auth**: [Auth.js v5 (NextAuth)](https://authjs.dev) with Credentials + Google + GitHub providers, JWT session strategy
- **Token mint**: `jose` HS256 — every session carries a 15-minute bearer that the FastAPI backend validates
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript (strict)
- **Deploy adapter**: `@opennextjs/cloudflare` → Cloudflare Workers
- **Theme**: High-Contrast Minimalist (Deep Black `#09090B`, White `#FFFFFF`, Slate `#64748B`, sharp edges, 1px borders, no shadows)
- **Typography**: Geist Sans (UI) / Geist Mono (LLM output, metrics)

## Data model

| Table | Purpose |
|-------|---------|
| `users` | id (UUID), email (unique), password_hash (nullable for OAuth), email_verified, name, image |
| `verification_tokens` | identifier (`verify:<email>` or `reset:<email>`) + token + expires |
| `token_usage` | user_id, day (date), tokens_in, tokens_out, cost_usd — unique on (user_id, day) |
| `applications` | id, user_id (FK), company, title, description, applied_at, status, analysis (JSONB), analysis_hash, timestamps |

Status enum: `saved`, `applied`, `interviewing`, `offer`, `rejected`, `withdrawn`.

CV text is **never persisted**. Only the SHA256 hash and the structured analysis are stored.

## API

All `/applications/*` and `/auth/oauth-upsert` require the relevant credential. `/auth/*` (except oauth-upsert) and `/healthz` are public.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/auth/register` | — | Create unverified user, send verify email |
| `POST` | `/auth/verify` | — | Consume verify token, mark email verified |
| `POST` | `/auth/login` | — | Validate password + verified status (called by Auth.js) |
| `POST` | `/auth/forgot` | — | Send reset email (always 200) |
| `POST` | `/auth/reset` | — | Consume reset token, set new password |
| `POST` | `/auth/oauth-upsert` | `X-Auth-Secret` | Find-or-create user from OAuth profile |
| `GET`  | `/applications` | Bearer | List own applications |
| `POST` | `/applications` | Bearer | Create |
| `GET`  | `/applications/{id}` | Bearer | Detail (own only) |
| `PATCH`| `/applications/{id}` | Bearer | Partial update |
| `DELETE`| `/applications/{id}` | Bearer | Remove |
| `POST` | `/applications/{id}/match?force=false` | Bearer | Run LLM match. Returns cached unless `force=true`. Deducts from daily budget. |
| `GET`  | `/healthz` | — | Liveness |

## Environment variables

### Backend

| Key | Required | Default |
|-----|----------|---------|
| `DATABASE_URL` | yes | injected by Railway |
| `OPENROUTER_API_KEY` | yes | — |
| `OPENROUTER_MODEL` | no | `openai/gpt-4o-mini` |
| `OPENROUTER_BASE_URL` | no | `https://openrouter.ai/api/v1` |
| `BACKEND_JWT_SECRET` | yes | shared with the Worker; HS256 secret for bearer JWTs |
| `AUTH_SHARED_SECRET` | yes (if OAuth) | shared with the Worker; required on `/auth/oauth-upsert` |
| `DAILY_TOKEN_BUDGET` | no | `50000` |
| `RESEND_API_KEY` | yes | for verify/reset emails |
| `EMAIL_FROM` | yes | verified Resend sender |
| `FRONTEND_BASE_URL` | yes | origin used in mailed links |
| `CORS_ORIGINS` | no | `http://localhost:3000` |
| `LOGFIRE_TOKEN` | no | — |
| `LOGFIRE_SEND_TO_LOGFIRE` | no | `if-token-present` |
| `APP_ENV` | no | `development` |

### Frontend

| Key | Required | Where | Notes |
|-----|----------|-------|-------|
| `NEXT_PUBLIC_API_URL` | yes | build-time | backend base URL |
| `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED` | no | build-time | `1` to show Google button |
| `NEXT_PUBLIC_AUTH_GITHUB_ENABLED` | no | build-time | `1` to show GitHub button |
| `AUTH_SECRET` | yes | wrangler secret | Auth.js session encryption |
| `BACKEND_JWT_SECRET` | yes | wrangler secret | same value as backend |
| `AUTH_SHARED_SECRET` | yes (if OAuth) | wrangler secret | same value as backend |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | no | wrangler secret | Google OAuth |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | no | wrangler secret | GitHub OAuth |

## Local development

```bash
# Backend
cd backend
uv venv --python 3.12 && source .venv/bin/activate
uv pip install -e ".[dev]"
cp .env.example .env   # fill in secrets
alembic upgrade head
uvicorn app.main:app --reload

# Seed demo data (optional)
python -m scripts.seed --reset

# Frontend
cd web-client
npm install
cp .env.example .env.local   # fill in secrets
npm run dev
```

## Deploy

- **Backend**: push `backend/` to Railway. Attach the Postgres plugin (auto-injects `DATABASE_URL`). Set `OPENROUTER_API_KEY`, `BACKEND_JWT_SECRET`, `AUTH_SHARED_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `FRONTEND_BASE_URL`, `CORS_ORIGINS`. Railway builds the Dockerfile and runs `boot.sh` (alembic + uvicorn).
- **Frontend**: see [`web-client/DEPLOY.md`](web-client/DEPLOY.md). Set build-time vars in `.env.production` and runtime secrets via `wrangler secret put`, then `npm run deploy`.

## License

This project is licensed under the [GPLv3 License](LICENSE).
