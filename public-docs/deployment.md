# Deployment

## Backend — Cloudflare Workers (`curriclean-api/`)

### First-time setup

```sh
cd curriclean-api

# 1. Create Cloudflare resources (skip if already provisioned)
wrangler d1 create curriclean
wrangler kv namespace create curriclean-budget-kv
# Copy the returned IDs into wrangler.jsonc

# 2. Apply database migrations
wrangler d1 migrations apply curriclean --remote

# 3. Set secrets
wrangler secret put JWT_SECRET
wrangler secret put AUTH_SHARED_SECRET
# Optional: Stripe credit packs (checkout stays disabled without them)
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
```

### Deploy

```sh
bun run deploy
```

### Update schema (future migrations)

Add a new `.sql` file to `curriclean-api/migrations/` following the `NNN_description.sql` naming convention, then:

```sh
wrangler d1 migrations apply curriclean --remote
```

---

## Frontend — Cloudflare Workers

See `web-client/DEPLOY.md` for the full guide. Set build-time vars in `.env.production` and runtime secrets via `wrangler secret put`:

```sh
wrangler secret put AUTH_SECRET
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
