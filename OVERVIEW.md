# SpecFit

Open-source job application tracker with LLM-powered CV matching.

Paste a job description and your CV to receive a structured fit score, matched skills, gaps, and a tailored recommendation. Track applications through their full lifecycle. Sign in with email + password (with verification) or Google / GitHub OAuth. Every user gets an enforced daily LLM token budget.

**Platform:**

| Layer | Platform |
|-------|----------|
| Backend | [Cloudflare Workers](https://workers.cloudflare.com) — Hono, TypeScript (`specfit-api/`) |
| Database | [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite) |
| Token budget cache | [Cloudflare Workers KV](https://developers.cloudflare.com/kv/) |
| LLM inference | [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/) (default `llama-3.3-70b-instruct-fp8-fast`); optional [OpenRouter](https://openrouter.ai) fallback |
| Frontend | [Cloudflare Workers](https://workers.cloudflare.com) via `@opennextjs/cloudflare` (Next.js 16) |
| Email | [Resend](https://resend.com) |

Repository: [github.com/rubrion/specfit](https://github.com/rubrion/specfit)
