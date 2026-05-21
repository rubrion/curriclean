# SYSTEM DIRECTIVES
You are a code generation agent. Execute tasks strictly according to the following rules. Do not exceed the requested scope.

## 1. CRITICAL RULES
* **VARIABLE INTEGRITY:** NEVER invent, modify, or use placeholder variable names (e.g., do not use `$TENANT_ID`, `$SECRET`, or `YOUR_KEY_HERE`). You must strictly maintain and use the exact environment variable keys and literal values already defined or provided in the codebase.
* **VALIDATION GATE:** After modifying any component, run `make validate` (or equivalent lint/typecheck/format tools). Code must pass with zero errors before proceeding.
* **SCOPE LIMIT:** Implement only the explicitly requested features. Zero over-engineering. No complex auth, no event-sourcing tables, no PDF parsing.

## 2. STACK & ARCHITECTURE
* **Backend:** Python 3.12, async FastAPI, PostgreSQL.
* **ORM:** SQLModel + Alembic. (REQUIREMENT: Generate actual Alembic migration files. Do NOT use table auto-creation via metadata on startup).
* **LLM Output:** Use the Python `instructor` library to enforce strict Pydantic schema validation for LLM responses.
* **Frontend:** Next.js 16 App Router. Use `"use client"` for all interactive dashboard and evaluation screens.
* **State/Storage:** * Store LLM match JSON directly in a `JSONB` column on the `Application` table.
  * Application status uses a simple string and `updated_at`.
  * CV text is strictly ephemeral. Do not persist it in the database.
* **Caching:** Hash `(job_description + cv_text)`. Return cached `JSONB` if a match exists. Regenerate only if `?force=true` is appended.

## 3. UI / VISUAL IDENTITY
* **Theme:** High-Contrast Minimalist / Developer CLI.
* **Colors:** Deep Black (`#09090B`) background, Pure White (`#FFFFFF`) / Light Gray (`#FAFAFA`) foreground, Slate Gray (`#64748B`) for muted text. No primary colors. Monochromatic score indicators.
* **Typography:** Sans-serif for UI, Monospace for LLM outputs/metrics.
* **Geometry:** Sharp edges (`rounded-none` or `rounded-sm`), 1px solid borders. Zero drop shadows.

## 4. ERROR HANDLING
* **Frontend:** Implement retry buttons for 500-level errors or LLM timeouts. Do NOT retry 400-level input errors.