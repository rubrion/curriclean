# Environment Variables

## Backend

| Key | Required | Default |
|-----|----------|---------|
| `DATABASE_URL` | yes | injected by Railway |
| `OPENROUTER_API_KEY` | yes | — |
| `OPENROUTER_MODEL` | no | `openai/gpt-4o-mini` |
| `OPENROUTER_BASE_URL` | no | `https://openrouter.ai/api/v1` |
| `BACKEND_JWT_SECRET` | yes | shared with the Worker; HS256 secret for bearer JWTs |
| `AUTH_SHARED_SECRET` | yes (if OAuth) | shared with the Worker; required on `/auth/oauth-upsert` |
| `DAILY_TOKEN_BUDGET` | no | `50000` |
| `BRAVE_API_KEY` | no | enables `/applications/{id}/suggested-profiles`; empty hides the feature |
| `BRAVE_SEARCH_URL` | no | `https://api.search.brave.com/res/v1/web/search` |
| `CV_PDF_MAX_BYTES` | no | `5000000` |
| `RESEND_API_KEY` | yes | for verify/reset emails |
| `EMAIL_FROM` | yes | verified Resend sender |
| `FRONTEND_BASE_URL` | yes | origin used in mailed links |
| `CORS_ORIGINS` | no | `http://localhost:3000` |
| `LOGFIRE_TOKEN` | no | — |
| `APP_ENV` | no | `development` |

## Frontend

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
