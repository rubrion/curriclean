# API Reference

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
| `POST` | `/applications/{id}/suggested-profiles?refresh=false` | Bearer | Cached LinkedIn profile hits via Brave Search. `refresh=true` re-fetches. |
| `POST` | `/cv/parse-pdf` (multipart) | Bearer | Extract plain text from a PDF resume. |
| `GET`  | `/healthz` | — | Liveness |
