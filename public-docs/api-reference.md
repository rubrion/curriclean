# API Reference

All `/applications/*` and `/auth/oauth-upsert` require the relevant credential. `/auth/*` (except oauth-upsert) `/stripe/webhook` and `/health` are public.

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
| `GET`  | `/applications/stats` | Bearer | Dashboard numbers: counts by status, average score, score series, credits spent |
| `POST` | `/applications/{id}/match?force=false` | Bearer | Fit analysis `{analysis, updated_at}`. Same CV returns the saved result (free) unless `force=true`. Costs 1 credit (daily free credit first, then wallet); `402 INSUFFICIENT_CREDITS` when they don't cover it. |
| `POST` | `/applications/{id}/tailor?force=false` | Bearer | Tailored CV suggestions `{tailored, updated_at}` targeting the analysis gaps (`409 ANALYSIS_REQUIRED` without one). Costs 2 credits. |
| `POST` | `/cv/parse-pdf` (multipart) | Bearer | Extract plain text from a PDF resume. |
| `GET`  | `/billing` | Bearer | Wallet credits, daily free credit left, prices, packs, whether checkout is enabled |
| `POST` | `/billing/checkout` `{pack}` | Bearer | Opens an embedded Stripe Checkout session → `{client_secret, ref}` |
| `GET`  | `/billing/payments/{ref}` | Bearer | Whether the webhook has credited a payment |
| `GET`  | `/billing/history` | Bearer | Ledger: top-ups, refunds, spends |
| `POST` | `/stripe/webhook` | Stripe signature | `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`, `charge.dispute.created` |
| `GET`  | `/health` | — | Liveness |
