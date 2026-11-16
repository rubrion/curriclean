# SYSTEM DIRECTIVES
You are a code generation agent. Execute tasks strictly according to the following rules. Do not exceed the requested scope.

## 1. CRITICAL RULES
* **VARIABLE INTEGRITY:** NEVER invent, modify, or use placeholder variable names (e.g., do not use `$TENANT_ID`, `$SECRET`, or `YOUR_KEY_HERE`). You must strictly maintain and use the exact environment variable keys and literal values already defined or provided in the codebase.
* **VALIDATION GATE:** After modifying any component, run `make validate` from the repo root (API typecheck, web lint + typecheck + build). Code must pass with zero errors before proceeding.
* **SCOPE LIMIT:** Implement only the explicitly requested features. Zero over-engineering. No complex auth, no event-sourcing tables.

## 2. STACK & ARCHITECTURE
* **Backend:** `curriclean-api/` — Hono on Cloudflare Workers (TypeScript), D1 (SQLite) via raw prepared statements, KV for the daily usage cache.
* **Migrations:** SQL files in `curriclean-api/migrations/` applied with `wrangler d1 migrations apply`. Never create tables at runtime.
* **LLM Output:** Workers AI binding only (`MODEL` in `src/services/llm.ts`), `response_format: json_schema`, every response validated with **zod**.
* **Frontend:** Next.js 16 App Router (`web-client/`). Use `"use client"` for all interactive dashboard and evaluation screens. Fetch with `useApiQuery` (`src/lib/useApiQuery.ts`).
* **State/Storage:**
  * LLM results are stored as JSON on the `applications` row (`analysis`, `tailored`).
  * Application status uses a simple string and `updated_at`.
  * CV text is strictly ephemeral. Do not persist it in the database.
* **Caching:** Hash `(model + job_description + cv_text)`. Return the stored result if the hash matches. Regenerate only with `?force=true`. Never show cache/model/token internals in the UI.
* **Billing:** Free daily runs, then prepaid credits (`src/services/credits.ts`). Stripe packs via REST + signed webhook (`src/services/stripe.ts`); every wallet movement goes through the `ledger` table.

## 3. UI / VISUAL IDENTITY
* **Design system:** shadcn/ui (`src/components/ui`, add with `npx shadcn@latest add`). Do not hand-roll primitives that shadcn provides.
* **Theme:** "Cozy paper". Tokens only from `src/app/globals.css` (no hardcoded hex in components). Light + dark via `next-themes`.
* **Colors:** Warm cream `#FBF7F2` / warm charcoal `#1C1917` surfaces, logo red `#C42524` as the single brand accent (`primary`). Semantic: `success` (sage), `warning` (amber), `danger` (terracotta), `info` (slate-blue) for scores and statuses.
* **Typography:** Geist Sans for UI; Geist Mono only for small numerics.
* **Geometry:** `--radius: 0.75rem`, soft shadow (`shadow-soft`) for hover/featured only.
* **Logo:** keep `public/logo.png`; render with the `logo-mark` utility / `<Logo />` (masked with `primary`).
* **Copy:** user-facing errors go through `src/lib/errors.ts` (friendly title + message). Never render raw error codes or JSON.

## 4. ERROR HANDLING
* **Frontend:** Implement retry buttons for 500-level errors or LLM timeouts. Do NOT retry 400-level input errors.