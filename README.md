# SpecFit

Open-source job application tracker with LLM-powered CV matching.

Paste a job description and your CV. Get a structured fit score, matched skills, gaps, and a tailored recommendation. Track applications through their lifecycle. Sign in with email + password (with verification) or Google / GitHub OAuth. Every user gets an enforced daily LLM token budget.

## Features

- **CV PDF upload** — drop a PDF resume on the application detail page; the backend extracts text with `unpdf` and populates the CV field. 5 MB limit. Scanned-only PDFs are rejected.
- **LLM match analysis** — paste/upload CV → structured fit score, strengths, gaps, interview questions. Results cached per `(model, job_description, cv_text)` hash; re-run with `?force=true`.
- **Suggested LinkedIn profiles** — single button per application queries the [Brave Search API](https://brave.com/search/api/) for `site:linkedin.com/in/` hits matching the role + company. Results cached on the row; "Refresh" re-fetches and keeps the previous list if the new fetch fails.
- **Status tracking** — `saved` → `applied` → `interviewing` → `offer` / `rejected` / `withdrawn`.
- **Authentication** — email + password (Resend-verified, bcrypt) and optional Google / GitHub OAuth. The backend issues HS256 bearer JWTs; the frontend uses Auth.js with the same secret.
- **Per-user daily token budget** — every `/match` call deducts from a daily cap tracked in `token_usage`; over-cap returns `429 DAILY_TOKEN_LIMIT`. Budget reads are KV-first for ~1 ms edge latency.

## Platform

| Layer | Platform |
|-------|----------|
| Backend runtime | [Cloudflare Workers](https://workers.cloudflare.com) — Hono, TypeScript |
| Database | [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite) |
| Token budget cache | [Cloudflare Workers KV](https://developers.cloudflare.com/kv/) |
| LLM inference | [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/) (`llama-3.3-70b-instruct-fp8-fast`); optional [OpenRouter](https://openrouter.ai) fallback |
| Frontend runtime | [Cloudflare Workers](https://workers.cloudflare.com) via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) (Next.js 16) |
| Transactional email | [Resend](https://resend.com) (verify + password-reset) |

## Stack

### Backend (`specfit-api/`)

- **Language**: TypeScript (strict)
- **Framework**: [Hono](https://hono.dev)
- **Runtime**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite) — plain SQL migrations, no ORM
- **Auth**: own credentials store with `bcryptjs` hashes, verify/reset tokens, OAuth upsert endpoint; HS256 JWT issued by the Worker via Web Crypto
- **Email**: Resend SDK
- **LLM**: Cloudflare Workers AI with structured JSON output; OpenRouter as optional fallback
- **Caching**: SHA-256 hash of `(model, job_description, cv_text)` against `analysis_hash`; bypass with `?force=true`
- **Budget**: per-user daily token cap in `token_usage`; KV-first reads, D1 as source of truth; over-cap returns `429 DAILY_TOKEN_LIMIT`
- **PDF parsing**: `unpdf` (edge-compatible, no Node.js fs dependency)
- **Validation**: Zod

### Frontend (`web-client/`)

- **Framework**: Next.js 16 (App Router)
- **Runtime**: React 19
- **Auth**: [Auth.js v5 (NextAuth)](https://authjs.dev) with Credentials + Google + GitHub providers, JWT session strategy
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript (strict)
- **Deploy adapter**: `@opennextjs/cloudflare` → Cloudflare Workers
- **Theme**: High-Contrast Minimalist (Deep Black `#09090B`, White `#FFFFFF`, Slate `#64748B`, sharp edges, 1px borders, no shadows)
- **Typography**: Geist Sans (UI) / Geist Mono (LLM output, metrics)

## Data model

| Table | Purpose |
|-------|---------|
| `users` | id (TEXT/UUID), email (unique), password_hash (nullable for OAuth), email_verified, name, image |
| `verification_tokens` | identifier (`verify:<email>` or `reset:<email>`) + token + expires |
| `token_usage` | user_id, day (TEXT, YYYY-MM-DD), tokens_in, tokens_out, cost_usd — unique on (user_id, day) |
| `applications` | id, user_id (FK), company, title, description, applied_at, status, analysis (JSON text), analysis_hash, suggested_profiles (JSON text), timestamps |

Status enum: `saved`, `applied`, `interviewing`, `offer`, `rejected`, `withdrawn`.

CV text is **never persisted**. Only the SHA-256 hash and the structured analysis are stored.

## API

All `/applications/*` and `/auth/oauth-upsert` require the relevant credential. `/auth/*` (except oauth-upsert) and `/health` are public.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET`  | `/health` | — | Liveness |
| `POST` | `/auth/register` | — | Create unverified user, send verify email |
| `POST` | `/auth/verify` | — | Consume verify token, mark email verified |
| `POST` | `/auth/login` | — | Validate password + verified status → returns `{ token, user }` |
| `POST` | `/auth/forgot` | — | Send reset email (always 200) |
| `POST` | `/auth/reset` | — | Consume reset token, set new password |
| `POST` | `/auth/oauth-upsert` | `X-Auth-Secret` | Find-or-create user from OAuth profile → returns `{ token, user }` |
| `GET`  | `/applications` | Bearer | List own applications |
| `POST` | `/applications` | Bearer | Create |
| `GET`  | `/applications/:id` | Bearer | Detail (own only) |
| `PATCH`| `/applications/:id` | Bearer | Partial update |
| `DELETE`| `/applications/:id` | Bearer | Remove |
| `POST` | `/applications/:id/match?force=false` | Bearer | Run LLM match. Returns cached unless `force=true`. Deducts from daily budget. |
| `POST` | `/applications/:id/suggested-profiles?refresh=false` | Bearer | Cached LinkedIn profile hits via Brave Search. `refresh=true` re-fetches; falls back to cached on error. |
| `POST` | `/cv/parse-pdf` (multipart) | Bearer | Extract plain text from a PDF resume. |

## Environment variables

See [environment-variables.md](environment-variables.md) for the full reference.

### Backend secrets (set via `wrangler secret put`)

| Key | Required |
|-----|----------|
| `JWT_SECRET` | yes |
| `AUTH_SHARED_SECRET` | yes (if OAuth) |
| `RESEND_API_KEY` | yes |
| `BRAVE_API_KEY` | no |
| `OPENROUTER_API_KEY` | no |

### Frontend secrets (set via `wrangler secret put`)

| Key | Required |
|-----|----------|
| `AUTH_SECRET` | yes |
| `JWT_SECRET` | yes |
| `AUTH_SHARED_SECRET` | yes (if OAuth) |

## Local development

```bash
# Backend
cd specfit-api
bun install
cp .dev.vars.example .dev.vars   # fill in secrets
wrangler d1 migrations apply specfit --local
bun run dev                       # → http://localhost:8787

# Frontend
cd web-client
npm install
cp .env.example .env.local        # fill in secrets
npm run dev
```

## Deploy

See [deployment.md](deployment.md) for the full guide.

```bash
# Backend
cd specfit-api
wrangler d1 migrations apply specfit --remote
bun run deploy

# Frontend
cd web-client
npm run deploy
```

## License

This project is licensed under the [GPLv3 License](LICENSE).
