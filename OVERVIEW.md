# SpecFit

Open-source job application tracker with LLM-powered CV matching.

Paste a job description and your CV to receive a structured fit score, matched skills, gaps, and a tailored recommendation. Track applications through their full lifecycle. Sign in with email + password (with verification) or Google / GitHub OAuth. Every user gets an enforced daily LLM token budget.

**Platform:**

| Layer | Platform |
|-------|----------|
| Backend | [Railway](https://railway.app) — FastAPI, Python 3.12, Docker |
| Database | Railway Postgres 16 (JSONB) |
| Frontend | [Cloudflare Workers](https://workers.cloudflare.com) via `@opennextjs/cloudflare` (Next.js 16) |
| LLM gateway | [OpenRouter](https://openrouter.ai) (default `openai/gpt-4o-mini`) |
| Email | [Resend](https://resend.com) |
| Observability | [Pydantic Logfire](https://logfire.pydantic.dev) |

Repository: [github.com/rubrion/specfit](https://github.com/rubrion/specfit)
