// Wraps one AI action: checks the global token cap and that the user can pay
// (free daily run or credits), runs it, then records usage and charges.
import { Env } from "../types";
import { assertUnderCap, BudgetExceededError, recordUsage } from "./budget";
import { Action, InsufficientCreditsError, quote, spend } from "./credits";
import { LlmError, LlmRun } from "./llm";

export type Metered<T> =
  | { ok: true; data: T }
  | { ok: false; status: 402 | 429 | 502; body: Record<string, unknown> };

export async function metered<T>(
  env: Env,
  userId: string,
  action: Action,
  note: string,
  run: () => Promise<LlmRun<T>>
): Promise<Metered<T>> {
  let mode: "free" | "credits";
  try {
    await assertUnderCap(env, userId);
    mode = await quote(env, userId, action);
  } catch (err) {
    if (err instanceof BudgetExceededError) {
      return { ok: false, status: 429, body: { detail: "DAILY_TOKEN_LIMIT" } };
    }
    if (err instanceof InsufficientCreditsError) {
      return {
        ok: false,
        status: 402,
        body: { detail: "INSUFFICIENT_CREDITS", needed: err.needed, have: err.have },
      };
    }
    throw err;
  }

  let result: LlmRun<T>;
  try {
    result = await run();
  } catch (err) {
    if (err instanceof LlmError) {
      console.error(`[llm] ${action} failed: ${err.message}`);
      return { ok: false, status: 502, body: { detail: "LLM_ERROR" } };
    }
    throw err;
  }

  await recordUsage(env, userId, result.tokensIn, result.tokensOut);
  if (mode === "credits") {
    await spend(env, userId, action, `spend_${crypto.randomUUID()}`, note);
  }
  return { ok: true, data: result.data };
}
