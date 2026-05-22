# Deploying SpecFit Web Client (Cloudflare Workers)

The web client deploys to Cloudflare Workers via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare). All user/auth state lives in the FastAPI backend (Railway + Postgres). The Worker holds no DB connection of its own.

## One-time setup

1. **Cloudflare account.** Authenticate Wrangler once:

   ```bash
   npx wrangler login
   ```

2. **Backend URL.** Decide your production API origin (Railway-hosted FastAPI, e.g. `https://specfit-api-production.up.railway.app`).

3. **CORS.** On the backend, set `CORS_ORIGINS` to include the Worker URL (e.g. `https://specfit.<subdomain>.workers.dev` or your custom domain).

4. **Resend.** Sign up at [resend.com](https://resend.com) (free tier: 100/day, 3000/mo).
   - Verify a sending domain — or use `onboarding@resend.dev` for dev.
   - Create an API key.
   - Set `RESEND_API_KEY` + `EMAIL_FROM` on the **backend** (not on the Worker — only the backend sends mail).

5. **OAuth (optional).** Create Google and/or GitHub OAuth apps.
   - Callback URLs:
     - Local: `http://localhost:3000/api/auth/callback/google` and `/github`
     - Prod: `https://<your-worker-host>/api/auth/callback/google` and `/github`

## Environment variables

### Build-time (baked into the client bundle by `next build`)

Set these in `.env.production` locally, or in Cloudflare dashboard → Workers → Settings → Build variables (Workers Builds CI).

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Backend base URL. |
| `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED` | Set to `1` to show the Google sign-in button. |
| `NEXT_PUBLIC_AUTH_GITHUB_ENABLED` | Set to `1` to show the GitHub sign-in button. |

### Runtime (Wrangler secrets)

Set with `npx wrangler secret put <NAME>` for each environment you deploy to. Never put these in `vars`.

| Secret | Purpose |
| --- | --- |
| `AUTH_SECRET` | Auth.js session JWT/cookie encryption. `openssl rand -base64 32`. |
| `BACKEND_JWT_SECRET` | HS256 secret to mint short-lived bearer tokens for the backend. **Must match the backend's value.** |
| `AUTH_SHARED_SECRET` | Sent on `X-Auth-Secret` when the Worker calls backend `/auth/oauth-upsert`. **Must match the backend's value.** |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth credentials (optional). |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth credentials (optional). |

### Backend env (Railway) — for context

| Key | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Auto-injected by Railway Postgres plugin. |
| `OPENROUTER_API_KEY` | yes | OpenRouter key. |
| `BACKEND_JWT_SECRET` | yes | Same value as the Worker secret above. |
| `AUTH_SHARED_SECRET` | yes (if OAuth) | Same value as the Worker secret above. |
| `DAILY_TOKEN_BUDGET` | no | Per-user daily LLM token cap. Default `50000`. |
| `RESEND_API_KEY` | yes | For verify / reset emails. |
| `EMAIL_FROM` | yes | Verified Resend sender, e.g. `SpecFit <auth@yourdomain.com>`. |
| `FRONTEND_BASE_URL` | yes | Origin used in verify/reset email links, e.g. `https://specfit.<sub>.workers.dev`. |
| `CORS_ORIGINS` | yes | Worker origin(s), comma-separated. |
| `LOGFIRE_TOKEN` | no | If unset, traces are local-only. |

## Local preview (workerd runtime)

```bash
npm run preview
```

Uses `.dev.vars` for runtime values and `.env.local` for build-time values.

## Deploy from your machine

```bash
# 1. fill in build-time vars
cp .env.production.example .env.production
$EDITOR .env.production   # set NEXT_PUBLIC_API_URL etc.

# 2. set Wrangler secrets (once per environment)
npx wrangler secret put AUTH_SECRET
npx wrangler secret put BACKEND_JWT_SECRET
npx wrangler secret put AUTH_SHARED_SECRET
# (optional)
npx wrangler secret put AUTH_GOOGLE_ID
npx wrangler secret put AUTH_GOOGLE_SECRET
npx wrangler secret put AUTH_GITHUB_ID
npx wrangler secret put AUTH_GITHUB_SECRET

# 3. deploy
npm run deploy
```

`npm run deploy` runs `opennextjs-cloudflare build && opennextjs-cloudflare deploy`. The build calls `next build`, which loads `.env.production`, then OpenNext bundles the worker and uploads it.

## Custom domain

Two options:

**A. Wrangler config** — edit `wrangler.jsonc`, add under the relevant env:

```jsonc
"routes": [
  { "pattern": "specfit.example.com", "custom_domain": true }
]
```

Then `npm run deploy -- --env production`.

**B. Dashboard** — Workers & Pages → your Worker → **Triggers → Add Custom Domain**.

The zone must already be on your Cloudflare account.

## CI/CD via Workers Builds

Connect the GitHub repo as a [Workers Build](https://developers.cloudflare.com/workers/ci-cd/builds/) and set:

- **Build command**: `npm run deploy`
- **Build directory**: `web-client/`
- **Build variables**: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED`, `NEXT_PUBLIC_AUTH_GITHUB_ENABLED`.
- **Secrets**: `AUTH_SECRET`, `BACKEND_JWT_SECRET`, `AUTH_SHARED_SECRET`, plus any OAuth secrets.

## Verifying

After deploy, hit:

- `https://<host>/` → redirects to `/login` if not signed in, otherwise `/applications`.
- `/register` → submit a real email → Resend mail arrives → click verify → `/login?verified=1`.
- `/login` → enter creds → land on `/applications` with 20 seeded demo rows (only for the `demo@specfit.dev` account).
- Network tab → backend requests carry `Authorization: Bearer <jwt>`.
- Hit the daily token cap → next `/match` returns `429 DAILY_TOKEN_LIMIT`.

If you see `Failed to fetch`, check `CORS_ORIGINS` on the backend and confirm `NEXT_PUBLIC_API_URL` was baked into the build.
