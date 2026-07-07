import { Env } from "../types";

const KV_TTL_SECONDS = 90_000; // ~25 hours — auto-expires stale day entries

export interface DailyUsage {
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function kvKey(userId: string, day: string): string {
  return `budget:${userId}:${day}`;
}

// ── Read today's usage (KV-first, D1 fallback) ────────────────────────────────

export async function getUsedToday(env: Env, userId: string): Promise<DailyUsage> {
  const day = todayUtc();
  const key = kvKey(userId, day);

  const cached = await env.BUDGET_KV.get<DailyUsage>(key, "json");
  if (cached) return cached;

  const row = await env.DB.prepare(
    "SELECT tokens_in, tokens_out, cost_usd FROM token_usage WHERE user_id = ? AND day = ?"
  )
    .bind(userId, day)
    .first<{ tokens_in: number; tokens_out: number; cost_usd: number }>();

  const usage: DailyUsage = row ?? { tokens_in: 0, tokens_out: 0, cost_usd: 0 };
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

export async function recordUsage(
  env: Env,
  userId: string,
  tokensIn: number,
  tokensOut: number,
  costUsd: number
): Promise<void> {
  const day = todayUtc();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  // D1: upsert (source of truth)
  await env.DB.prepare(`
    INSERT INTO token_usage (id, user_id, day, tokens_in, tokens_out, cost_usd, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (user_id, day) DO UPDATE SET
      tokens_in  = token_usage.tokens_in  + excluded.tokens_in,
      tokens_out = token_usage.tokens_out + excluded.tokens_out,
      cost_usd   = token_usage.cost_usd   + excluded.cost_usd,
      updated_at = excluded.updated_at
  `)
    .bind(id, userId, day, tokensIn, tokensOut, costUsd, now, now)
    .run();

  // KV: invalidate so next read re-fetches from D1
  await env.BUDGET_KV.delete(kvKey(userId, day));
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
