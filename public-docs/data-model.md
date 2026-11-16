# Data Model

| Table | Purpose |
|-------|---------|
| `users` | id (UUID), email (unique), password_hash (nullable for OAuth), email_verified, name, image |
| `verification_tokens` | identifier (`verify:<email>` or `reset:<email>`) + token + expires |
| `token_usage` | user_id, day, tokens_in, tokens_out, credits_used (credits spent that day; the part past `FREE_DAILY_CREDITS` comes from the wallet) — unique on (user_id, day) |
| `applications` | id, user_id (FK), company, title, description, applied_at, status, analysis (JSON) + analysis_hash, tailored (JSON) + tailored_hash, suggested_profiles (JSON), timestamps |
| `wallets` | user_id (PK), credits (≥ 0) |
| `payments` | id (`pay_…`, our ref carried through Stripe), user_id, pack (USD), credits, status `open` / `paid`, paid_at |
| `ledger` | ref (PK — makes each top-up / refund / spend apply once), user_id, credits (+/−), kind `topup` / `refund` / `spend`, note |

**Application status enum:** `saved` → `applied` → `interviewing` → `offer` / `rejected` / `withdrawn`.

CV text is **never persisted**. Only the SHA-256 hash and the structured results are stored.
