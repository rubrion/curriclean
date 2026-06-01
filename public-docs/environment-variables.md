# Environment Variables

## Backend (`specfit-api/`)

Secrets are set via `wrangler secret put <NAME>`. Non-sensitive vars live in `wrangler.jsonc → vars` and can be committed.

### Secrets

| Key | Required | Notes |
|-----|----------|-------|
| `JWT_SECRET` | yes | HS256 signing secret for access tokens; must match the frontend |
| `AUTH_SHARED_SECRET` | yes (if OAuth) | Server-to-server secret for `/auth/oauth-upsert`; must match the frontend |
| `RESEND_API_KEY` | yes | Transactional email (verify + reset) |
| `BRAVE_API_KEY` | no | Enables `/applications/{id}/suggested-profiles`; feature hidden if absent |
| `OPENROUTER_API_KEY` | no | Use OpenRouter instead of Workers AI for LLM inference |

### Vars (non-sensitive, in `wrangler.jsonc`)

| Key | Default | Notes |
|-----|---------|-------|
| `DAILY_TOKEN_BUDGET` | `50000` | Per-user daily token cap across all LLM calls |
| `CV_PDF_MAX_BYTES` | `5242880` | Max PDF upload size (5 MB) |
| `FRONTEND_URL` | `http://localhost:3000` | Origin used in verify/reset email links and CORS |
| `OPENROUTER_MODEL` | `openai/gpt-4o-mini` | Model used when `OPENROUTER_API_KEY` is set |
| `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` | OpenRouter endpoint |

### Cloudflare Bindings (in `wrangler.jsonc`)

| Binding | Type | Purpose |
|---------|------|---------|
| `DB` | D1 | Primary SQLite database (`specfit`) |
| `BUDGET_KV` | KV | Daily token budget cache (`specfit-budget-kv`) |
| `AI` | Workers AI | LLM inference — no key needed |

---

## Frontend

| Key | Required | Where | Notes |
|-----|----------|-------|-------|
| `NEXT_PUBLIC_API_URL` | yes | build-time | Backend Worker URL |
| `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED` | no | build-time | `1` to show Google button |
| `NEXT_PUBLIC_AUTH_GITHUB_ENABLED` | no | build-time | `1` to show GitHub button |
| `AUTH_SECRET` | yes | wrangler secret | Auth.js session encryption |
| `JWT_SECRET` | yes | wrangler secret | Same value as backend `JWT_SECRET` |
| `AUTH_SHARED_SECRET` | yes (if OAuth) | wrangler secret | Same value as backend `AUTH_SHARED_SECRET` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | no | wrangler secret | Google OAuth |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | no | wrangler secret | GitHub OAuth |
