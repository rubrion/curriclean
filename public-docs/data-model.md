# Data Model

| Table | Purpose |
|-------|---------|
| `users` | id (UUID), email (unique), password_hash (nullable for OAuth), email_verified, name, image |
| `verification_tokens` | identifier (`verify:<email>` or `reset:<email>`) + token + expires |
| `token_usage` | user_id, day (date), tokens_in, tokens_out, cost_usd — unique on (user_id, day) |
| `applications` | id, user_id (FK), company, title, description, applied_at, status, analysis (JSONB), analysis_hash, suggested_profiles (JSONB), suggested_profiles_updated_at, timestamps |

**Application status enum:** `saved` → `applied` → `interviewing` → `offer` / `rejected` / `withdrawn`.

CV text is **never persisted**. Only the SHA256 hash and the structured analysis are stored.
