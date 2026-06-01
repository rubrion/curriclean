# Deployment

## Backend — Cloudflare Workers (`specfit-api/`)

### First-time setup

```sh
cd specfit-api

# 1. Create Cloudflare resources (skip if already provisioned)
wrangler d1 create specfit
wrangler kv namespace create specfit-budget-kv
# Copy the returned IDs into wrangler.jsonc

# 2. Apply database migrations
wrangler d1 migrations apply specfit --remote

# 3. Set secrets
wrangler secret put JWT_SECRET
wrangler secret put AUTH_SHARED_SECRET
wrangler secret put RESEND_API_KEY
wrangler secret put BRAVE_API_KEY
# Optional: only needed to use OpenRouter instead of Workers AI
wrangler secret put OPENROUTER_API_KEY
```

### Deploy

```sh
bun run deploy
```

### Update schema (future migrations)

Add a new `.sql` file to `specfit-api/migrations/` following the `NNN_description.sql` naming convention, then:

```sh
wrangler d1 migrations apply specfit --remote
```

---

## Frontend — Cloudflare Workers

See `web-client/DEPLOY.md` for the full guide. Set build-time vars in `.env.production` and runtime secrets via `wrangler secret put`:

```sh
wrangler secret put AUTH_SECRET
wrangler secret put JWT_SECRET          # same value as backend JWT_SECRET
wrangler secret put AUTH_SHARED_SECRET
# OAuth (optional)
wrangler secret put AUTH_GOOGLE_ID
wrangler secret put AUTH_GOOGLE_SECRET
wrangler secret put AUTH_GITHUB_ID
wrangler secret put AUTH_GITHUB_SECRET
```

Then deploy:

```sh
npm run deploy
```
