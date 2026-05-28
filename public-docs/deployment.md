# Deployment

## Backend — Railway

Push `backend/` to Railway. Attach the Postgres plugin (auto-injects `DATABASE_URL`). Set the following env vars:

- `OPENROUTER_API_KEY`
- `BACKEND_JWT_SECRET`
- `AUTH_SHARED_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `FRONTEND_BASE_URL`
- `CORS_ORIGINS`

Railway builds the Dockerfile and runs `boot.sh` (`alembic upgrade head` then `uvicorn`).

## Frontend — Cloudflare Workers

See `web-client/DEPLOY.md` for the full guide. Set build-time vars in `.env.production` and runtime secrets via `wrangler secret put`:

```sh
wrangler secret put AUTH_SECRET
wrangler secret put BACKEND_JWT_SECRET
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
