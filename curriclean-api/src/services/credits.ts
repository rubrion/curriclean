// Prepaid credits: every user gets a few free AI runs per day; past that, each
// run spends credits from their wallet. Wallets are topped up by Stripe packs.
import { Env } from "../types";
import { getUsedToday } from "./budget";

/** Credits each AI action costs once the daily free runs are used. */
export const PRICES = { analysis: 1, tailor: 2 } as const;
export type Action = keyof typeof PRICES;

/** Packs: US dollars paid → credits granted. */
export const PACKS = { "5": 50, "10": 120, "25": 350 } as const;
export type Pack = keyof typeof PACKS;

export function freeDailyRuns(env: Env): number {
  return parseInt(env.FREE_DAILY_RUNS ?? "3", 10);
}

export async function balance(env: Env, userId: string): Promise<number> {
  const row = await env.DB.prepare("SELECT credits FROM wallets WHERE user_id = ?")
    .bind(userId)
    .first<{ credits: number }>();
  return row?.credits ?? 0;
}

export async function freeRunsLeft(env: Env, userId: string): Promise<number> {
  const usage = await getUsedToday(env, userId);
  return Math.max(0, freeDailyRuns(env) - usage.runs);
}

/** How a run will be paid: from the daily free allowance or the wallet. Throws if neither covers it. */
export async function quote(env: Env, userId: string, action: Action): Promise<"free" | "credits"> {
  if ((await freeRunsLeft(env, userId)) > 0) return "free";
  const have = await balance(env, userId);
  if (have < PRICES[action]) throw new InsufficientCreditsError(PRICES[action], have);
  return "credits";
}

/**
 * Take `PRICES[action]` credits from the wallet, once per `ref`. The update only
 * applies when the balance covers it, and the ledger row only when it applied.
 */
export async function spend(env: Env, userId: string, action: Action, ref: string, note: string) {
  const n = PRICES[action];
  const now = new Date().toISOString();
  const upd = await env.DB.prepare(
    "UPDATE wallets SET credits = credits - ?, updated_at = ? WHERE user_id = ? AND credits >= ?"
  )
    .bind(n, now, userId, n)
    .run();
  if (!(upd.meta.changes ?? 0)) return false;
  await env.DB.prepare(
    `INSERT INTO ledger (ref, user_id, credits, kind, note, created_at) VALUES (?, ?, ?, 'spend', ?, ?)
     ON CONFLICT (ref) DO NOTHING`
  )
    .bind(ref, userId, -n, note, now)
    .run();
  return true;
}

/** Add credits to a wallet (statement for a batch). */
export function depositStatement(env: Env, userId: string, credits: number) {
  const now = new Date().toISOString();
  return env.DB.prepare(
    `INSERT INTO wallets (user_id, credits, updated_at) VALUES (?, ?, ?)
     ON CONFLICT (user_id) DO UPDATE SET credits = wallets.credits + excluded.credits, updated_at = excluded.updated_at`
  ).bind(userId, credits, now);
}

export class InsufficientCreditsError extends Error {
  constructor(
    public readonly needed: number,
    public readonly have: number
  ) {
    super(`Insufficient credits (${have}/${needed})`);
    this.name = "InsufficientCreditsError";
  }
}
