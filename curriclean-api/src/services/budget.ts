import { Env } from "../types";

const KV_TTL_SECONDS = 90_000; // ~25 hours — auto-expires stale day entries

export interface DailyUsage {
  tokens_in: number;
  tokens_out: number;
  credits_used: number;
}

export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function kvKey(userId: string, day: string): string {
  return `budget:v2:${userId}:${day}`; // v2: credits_used (v1 cached runs)
}

/** Drop today's cached usage (account deletion). Older days expire on their own. */
export async function forgetUsage(env: Env, userId: string): Promise<void> {
  await env.BUDGET_KV.delete(kvKey(userId, todayUtc()));
}

// ── Read today's usage (KV-first, D1 fallback) ────────────────────────────────

export async function getUsedToday(env: Env, userId: string): Promise<DailyUsage> {
  const day = todayUtc();
  const key = kvKey(userId, day);

  const cached = await env.BUDGET_KV.get<DailyUsage>(key, "json");
  if (cached) return cached;

  const row = await env.DB.prepare(
    "SELECT tokens_in, tokens_out, credits_used FROM token_usage WHERE user_id = ? AND day = ?"
  )
    .bind(userId, day)
    .first<DailyUsage>();

  const usage: DailyUsage = row ?? { tokens_in: 0, tokens_out: 0, credits_used: 0 };
  await env.BUDGET_KV.put(key, JSON.stringify(usage), { expirationTtl: KV_TTL_SECONDS });
  return usage;
}

// ── Enforce daily cap — throws HTTP 429 detail ────────────────────────────────

export async function assertUnderCap(env: Env, userId: string): Promise<void> {
  const budget = parseInt(env.DAILY_TOKEN_BUDGET, 10);
  const usage = await getUsedToday(env, userId);
  const total = usage.tokens_in + usage.tokens_out;
  if (total >= budget) {
    throw new BudgetExceededError(total, budget);
  }
}

// ── Record usage after a successful LLM call ──────────────────────────────────

/** Add tokens and the action's credits to today's row; returns credits spent today after it. */
export async function recordUsage(
  env: Env,
  userId: string,
  tokensIn: number,
  tokensOut: number,
  credits: number
): Promise<number> {
  const day = todayUtc();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  // D1: upsert (source of truth)
  const row = await env.DB.prepare(`
    INSERT INTO token_usage (id, user_id, day, tokens_in, tokens_out, credits_used, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (user_id, day) DO UPDATE SET
      tokens_in    = token_usage.tokens_in    + excluded.tokens_in,
      tokens_out   = token_usage.tokens_out   + excluded.tokens_out,
      credits_used = token_usage.credits_used + excluded.credits_used,
      updated_at   = excluded.updated_at
    RETURNING credits_used
  `)
    .bind(id, userId, day, tokensIn, tokensOut, credits, now, now)
    .first<{ credits_used: number }>();

  // KV: invalidate so next read re-fetches from D1
  await env.BUDGET_KV.delete(kvKey(userId, day));
  return row?.credits_used ?? credits;
}

export class BudgetExceededError extends Error {
  constructor(
    public readonly used: number,
    public readonly limit: number
  ) {
    super(`Daily token budget exceeded (${used}/${limit})`);
    this.name = "BudgetExceededError";
  }
}
