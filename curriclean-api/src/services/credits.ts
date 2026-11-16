// Credits, the way Rubry does it: every account gets a daily free credit that
// resets at midnight UTC. Each AI action has a price in credits; it comes out of
// today's free credit first, and whatever the free credit doesn't cover comes
// out of the prepaid wallet (topped up by Stripe packs).
import { Env } from "../types";
import { getUsedToday } from "./budget";

/** Credits each AI action costs. */
export const PRICES = { analysis: 1, tailor: 2 } as const;
export type Action = keyof typeof PRICES;

/** Packs: US dollars paid → credits granted. */
export const PACKS = { "5": 50, "10": 120, "25": 350 } as const;
export type Pack = keyof typeof PACKS;

/** Free credit every account gets per UTC day. */
export function dailyCredit(env: Env): number {
  return parseInt(env.FREE_DAILY_CREDITS ?? "3", 10);
}

/** Accounts listed in UNLIMITED_FOR (comma-separated emails) never spend credits. */
export async function isUnlimited(env: Env, userId: string): Promise<boolean> {
  const list = (env.UNLIMITED_FOR ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (!list.length) return false;
  const row = await env.DB.prepare("SELECT email FROM users WHERE id = ?").bind(userId).first<{ email: string }>();
  return Boolean(row && list.includes(row.email.toLowerCase()));
}

export async function balance(env: Env, userId: string): Promise<number> {
  const row = await env.DB.prepare("SELECT credits FROM wallets WHERE user_id = ?")
    .bind(userId)
    .first<{ credits: number }>();
  return row?.credits ?? 0;
}

/** Credit left: `daily`, today's free credit not yet spent; `wallet`, the prepaid balance. */
export async function creditLeft(env: Env, userId: string) {
  const [usage, wallet] = await Promise.all([getUsedToday(env, userId), balance(env, userId)]);
  return { daily: Math.max(0, dailyCredit(env) - usage.credits_used), wallet };
}

/** Throws unless today's free credit and the wallet together cover the action. */
export async function assertCanAfford(env: Env, userId: string, action: Action) {
  const { daily, wallet } = await creditLeft(env, userId);
  if (daily + wallet < PRICES[action]) throw new InsufficientCreditsError(PRICES[action], daily + wallet);
}

/**
 * Charge an action that just ran, given today's credits spent after counting
 * it (`after`): the part past the daily free credit comes out of the wallet,
 * once per `ref`.
 */
export async function chargeOverflow(
  env: Env,
  userId: string,
  action: Action,
  after: number,
  ref: string,
  note: string
) {
  const price = PRICES[action];
  const daily = dailyCredit(env);
  const over = Math.max(0, after - daily) - Math.max(0, after - price - daily);
  if (!over) return 0;
  const now = new Date().toISOString();
  const ins = await env.DB.prepare(
    `INSERT INTO ledger (ref, user_id, credits, kind, note, created_at) VALUES (?, ?, ?, 'spend', ?, ?)
     ON CONFLICT (ref) DO NOTHING`
  )
    .bind(ref, userId, -over, note, now)
    .run();
  if (!(ins.meta.changes ?? 0)) return 0;
  await env.DB.prepare("UPDATE wallets SET credits = MAX(credits - ?, 0), updated_at = ? WHERE user_id = ?")
    .bind(over, now, userId)
    .run();
  return over;
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
