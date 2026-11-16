# Stack

## Backend (`curriclean-api/`)

- **Runtime**: Cloudflare Workers, [Hono](https://hono.dev), TypeScript (strict)
- **Database**: Cloudflare D1 (SQLite), raw prepared statements; SQL migrations in `migrations/`
- **Cache**: Workers KV (`BUDGET_KV`) in front of the daily usage row
- **LLM**: Workers AI binding (`@cf/google/gemma-4-26b-a4b-it`) with `response_format: json_schema`; every response is validated with **zod** (one retry on invalid output)
- **Caching**: SHA-256 of `(model, job_description, cv_text)` stored on the application; same inputs return the saved result for free, `?force=true` regenerates
- **Metering**: 3 free AI runs per user per day (`FREE_DAILY_RUNS`), then prepaid credits (analysis = 1, tailored CV = 2); a global `DAILY_TOKEN_BUDGET` caps abuse
- **Payments**: Stripe embedded Checkout via the REST API (no SDK); signed webhook credits each pack once, refunds/disputes take credits back
- **Auth**: hand-rolled HS256 JWT (WebCrypto) + bcrypt; verify/reset email via Resend
- **PDF**: `unpdf` text extraction (CV text is never stored)

## Frontend (`web-client/`)

- **Framework**: Next.js 16 (App Router), React 19, deployed with `@opennextjs/cloudflare`
- **Auth**: Auth.js v5 (Credentials + optional Google/GitHub), backend JWT carried in the session
- **Design system**: [shadcn/ui](https://ui.shadcn.com) (Radix, `radix-nova` style) on Tailwind CSS v4; charts with Recharts via shadcn `chart`
- **Theme**: "cozy paper" — warm cream / warm charcoal surfaces, logo red `#C42524` as the only brand accent, sage / amber / terracotta for score tiers and statuses; light + dark via `next-themes`. Tokens live in `src/app/globals.css`
- **Typography**: Geist Sans (UI), Geist Mono for small numerics
- **Other**: `@dnd-kit/core` (pipeline board), `@stripe/react-stripe-js` (embedded Checkout), `sonner` toasts
