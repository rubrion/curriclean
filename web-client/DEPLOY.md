# Deploying CurriClean (Cloudflare Workers)

Both the backend (`curriclean-api/`) and the web client (`web-client/`) deploy to Cloudflare Workers. There is no Railway or external server.

---

## Backend (`curriclean-api/`)

### One-time setup

1. **Authenticate Wrangler:**

   ```bash
   npx wrangler login
   ```

2. **Create Cloudflare resources** (skip if already provisioned):

   ```bash
   cd curriclean-api
   wrangler d1 create curriclean                   # copy database_id into wrangler.jsonc
   wrangler kv namespace create curriclean-budget-kv  # copy id into wrangler.jsonc
   ```

3. **Apply the schema:**

   ```bash
   wrangler d1 migrations apply curriclean --remote
   ```

4. **Set secrets:**

   ```bash
   wrangler secret put JWT_SECRET           # HS256 signing secret; must match the frontend
   wrangler secret put AUTH_SHARED_SECRET   # X-Auth-Secret for OAuth upsert; must match the frontend
   wrangler secret put RESEND_API_KEY       # Resend transactional email
   wrangler secret put BRAVE_API_KEY        # Brave Search (LinkedIn suggestions); optional
   # Optional: use OpenRouter instead of Workers AI
   wrangler secret put OPENROUTER_API_KEY
   ```

5. **Resend.** Sign up at [resend.com](https://resend.com) and verify a sending domain (or use `onboarding@resend.dev` for dev). Set `FRONTEND_URL` in `wrangler.jsonc → vars` to your frontend Worker URL so verify/reset links are correct.

6. **OAuth (optional).** Create Google and/or GitHub OAuth apps. Callback URLs:
   - Local: `http://localhost:3000/api/auth/callback/google` and `/github`
   - Prod: `https://<your-worker-host>/api/auth/callback/google` and `/github`

### Deploy

```bash
cd curriclean-api
bun run deploy
```

### Future schema migrations

Add a new `.sql` file to `curriclean-api/migrations/` using `NNN_description.sql` naming, then:

```bash
wrangler d1 migrations apply curriclean --remote
```

---

## Frontend (`web-client/`)

### Environment variables

**Build-time** (set in `.env.production` or Cloudflare dashboard → Workers → Build variables):

| Variable | Notes |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | Backend Worker URL, e.g. `https://curriclean-api.<sub>.workers.dev` |
| `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED` | Set to `1` to show the Google sign-in button |
| `NEXT_PUBLIC_AUTH_GITHUB_ENABLED` | Set to `1` to show the GitHub sign-in button |

**Runtime secrets** (`npx wrangler secret put <NAME>`):

| Secret | Purpose |
|--------|---------|
| `AUTH_SECRET` | Auth.js session JWT/cookie encryption. Generate: `openssl rand -base64 32` |
| `JWT_SECRET` | Must match the backend `JWT_SECRET` exactly |
| `AUTH_SHARED_SECRET` | Must match the backend `AUTH_SHARED_SECRET` exactly |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth (optional) |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth (optional) |

### Deploy

```bash
# 1. Fill in build-time vars
cp .env.production.example .env.production
$EDITOR .env.production   # set NEXT_PUBLIC_API_URL etc.

# 2. Set Wrangler secrets (once per environment)
npx wrangler secret put AUTH_SECRET
npx wrangler secret put JWT_SECRET
npx wrangler secret put AUTH_SHARED_SECRET
# Optional OAuth
npx wrangler secret put AUTH_GOOGLE_ID
npx wrangler secret put AUTH_GOOGLE_SECRET
npx wrangler secret put AUTH_GITHUB_ID
npx wrangler secret put AUTH_GITHUB_SECRET

# 3. Deploy
npm run deploy
```

`npm run deploy` runs `opennextjs-cloudflare build && opennextjs-cloudflare deploy`.

---

## Local development

```bash
# Backend
cd curriclean-api
bun install
cp .dev.vars.example .dev.vars   # fill in secrets
wrangler d1 migrations apply curriclean --local
bun run dev                       # → http://localhost:8787

# Frontend
cd web-client
npm install
cp .env.example .env.local        # set NEXT_PUBLIC_API_URL=http://localhost:8787
npm run dev                       # → http://localhost:3000
```

---

## Custom domain

**A. Wrangler config** — add to `wrangler.jsonc`:

```jsonc
"routes": [
  { "pattern": "curriclean.example.com", "custom_domain": true }
]
```

Then deploy with the relevant `--env` flag.

**B. Dashboard** — Workers & Pages → your Worker → **Triggers → Add Custom Domain**.

The zone must already be on your Cloudflare account.

---

## CI/CD via Workers Builds

Connect the GitHub repo as a [Workers Build](https://developers.cloudflare.com/workers/ci-cd/builds/).

**Backend** (`curriclean-api/`):
- Build command: `bun run deploy`
- Build directory: `curriclean-api/`
- Secrets: `JWT_SECRET`, `AUTH_SHARED_SECRET`, `RESEND_API_KEY`, `BRAVE_API_KEY`

**Frontend** (`web-client/`):
- Build command: `npm run deploy`
- Build directory: `web-client/`
- Build variables: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED`, `NEXT_PUBLIC_AUTH_GITHUB_ENABLED`
- Secrets: `AUTH_SECRET`, `JWT_SECRET`, `AUTH_SHARED_SECRET`, plus any OAuth secrets

---

## Verifying

After deploy, hit:

- `https://<host>/` → redirects to `/login` if not signed in, otherwise `/applications`.
- `GET https://<api-host>/health` → `{"status":"ok"}`.
- `/register` → submit a real email → Resend mail arrives → click verify → `/login?verified=1`.
- `/login` → enter creds → land on `/applications`.
- Network tab → backend requests carry `Authorization: Bearer <jwt>`.
- Hit the daily token cap → next `/match` returns `429 DAILY_TOKEN_LIMIT`.
