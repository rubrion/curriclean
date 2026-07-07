# specfit-api

Cloudflare Workers backend for **SpecFit** — an open-source job application tracker with LLM-powered CV matching.

Built with [Hono](https://hono.dev), [Cloudflare D1](https://developers.cloudflare.com/d1/), [Workers KV](https://developers.cloudflare.com/kv/), and [Workers AI](https://developers.cloudflare.com/workers-ai/).

---

## Stack

| Layer | Service |
|-------|---------|
| Runtime | Cloudflare Workers (Hono) |
| Database | D1 SQLite |
| Token budget cache | Workers KV |
| LLM inference | Workers AI (`llama-3.3-70b-instruct-fp8-fast`) |
| Email | Resend |
| Profile search | Brave Search API |

---

## Local development

### 1. Install dependencies

```bash
bun install
```

### 2. Configure secrets

```bash
cp .dev.vars.example .dev.vars
# Fill in values in .dev.vars
```

### 3. Create Cloudflare resources (first time only)

```bash
# Create D1 database
wrangler d1 create specfit

# Copy the returned database_id into wrangler.jsonc → d1_databases[0].database_id

# Create KV namespace (named with specfit prefix for dashboard clarity)
wrangler kv namespace create specfit-budget-kv

# Copy the returned id into wrangler.jsonc → kv_namespaces[0].id
```

### 4. Apply database migrations

```bash
# Local dev (creates a local SQLite file)
wrangler d1 migrations apply specfit --local

# Remote (production D1)
wrangler d1 migrations apply specfit --remote
```

### 5. Run locally

```bash
bun run dev
# → http://localhost:8787
```

---

## Deployment

### Set production secrets

```bash
wrangler secret put JWT_SECRET
wrangler secret put AUTH_SHARED_SECRET
wrangler secret put RESEND_API_KEY
wrangler secret put BRAVE_API_KEY
# Optional: only needed if using OpenRouter instead of Workers AI
wrangler secret put OPENROUTER_API_KEY
```

### Deploy

```bash
bun run deploy
```

### Regenerate binding types (after changing wrangler.jsonc)

```bash
bun run cf-typegen
```

---

## API Endpoints

### Public

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/auth/register` | Register with email + password |
| `POST` | `/auth/verify` | Verify email via token |
| `POST` | `/auth/login` | Login → returns `{ token, user }` |
| `POST` | `/auth/forgot` | Request password reset email |
| `POST` | `/auth/reset` | Reset password via token |

### Server-to-server

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/oauth-upsert` | `X-Auth-Secret` header | Create/update OAuth user → returns `{ token, user }` |

### Protected (Bearer JWT)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/applications` | List applications (filterable by status) |
| `POST` | `/applications` | Create application |
| `GET` | `/applications/:id` | Get application |
| `PATCH` | `/applications/:id` | Update application |
| `DELETE` | `/applications/:id` | Delete application |
| `POST` | `/applications/:id/match` | Run LLM CV match |
| `POST` | `/applications/:id/suggested-profiles` | LinkedIn profile suggestions |
| `POST` | `/cv/parse-pdf` | Extract text from PDF CV |

---

## LLM Strategy

By default, Workers AI (`llama-3.3-70b-instruct-fp8-fast`) is used — no API key required.

To use OpenRouter instead (e.g. for GPT-4o), set `OPENROUTER_API_KEY` as a secret and optionally configure `OPENROUTER_MODEL` and `OPENROUTER_BASE_URL` in `wrangler.jsonc → vars`.

---

## Token budget

Each user has a configurable daily token budget (`DAILY_TOKEN_BUDGET`, default 50,000 tokens).

Reads use a **KV-first** strategy: budget is checked from Workers KV (~1ms), falling back to D1 on cache miss. Usage is recorded in D1 (source of truth) and the KV entry is invalidated after each LLM call.

Cached match results (same job description + CV) bypass the budget entirely.
