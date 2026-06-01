import { Hono } from "hono";
import { z } from "zod";
import { ApplicationRow, Env, HonoVariables } from "../types";
import { jwtMiddleware } from "../lib/auth";
import { runMatch, buildCacheKey, LlmError } from "../services/llm";
import { assertUnderCap, recordUsage, BudgetExceededError } from "../services/budget";

const match = new Hono<{ Bindings: Env; Variables: HonoVariables }>();
match.use("*", jwtMiddleware());

const MatchRequestSchema = z.object({
  cv_text: z.string().min(50),
});

match.post("/:application_id/match", async (c) => {
  const userId = c.get("userId");
  const appId = c.req.param("application_id");
  const force = c.req.query("force") === "true";

  const app = await c.env.DB.prepare(
    "SELECT * FROM applications WHERE id = ? AND user_id = ?"
  )
    .bind(appId, userId)
    .first<ApplicationRow>();

  if (!app) return c.json({ detail: "NOT_FOUND" }, 404);

  const body = await c.req.json().catch(() => null);
  const parsed = MatchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ detail: "VALIDATION_ERROR", errors: parsed.error.flatten() }, 422);
  }

  const { cv_text } = parsed.data;
  const model = c.env.OPENROUTER_API_KEY
    ? c.env.OPENROUTER_MODEL
    : "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

  // Check cache unless force=true
  if (!force) {
    const cacheKey = await buildCacheKey(model, app.description, cv_text);
    if (app.analysis_hash === cacheKey && app.analysis) {
      return c.json({
        application_id: appId,
        analysis: JSON.parse(app.analysis).analysis,
        metrics: {
          ...JSON.parse(app.analysis).metrics,
          cached: true,
          cache_key: cacheKey,
        },
        updated_at: app.analysis_updated_at,
      });
    }
  }

  // Enforce daily token budget
  try {
    await assertUnderCap(c.env, userId);
  } catch (err) {
    if (err instanceof BudgetExceededError) {
      return c.json({ detail: "DAILY_TOKEN_LIMIT" }, 429);
    }
    throw err;
  }

  // Run LLM
  let result: Awaited<ReturnType<typeof runMatch>>;
  try {
    result = await runMatch(c.env, app.description, cv_text);
  } catch (err) {
    if (err instanceof LlmError) {
      return c.json({ detail: "LLM_ERROR", message: err.message }, 502);
    }
    throw err;
  }

  // Persist to D1
  const now = new Date().toISOString();
  const stored = JSON.stringify({ analysis: result.analysis, metrics: result.metrics });

  await c.env.DB.prepare(
    `UPDATE applications
     SET analysis = ?, analysis_hash = ?, analysis_updated_at = ?, updated_at = ?
     WHERE id = ?`
  )
    .bind(stored, result.metrics.cache_key, now, now, appId)
    .run();

  // Record token usage (non-fatal)
  recordUsage(
    c.env,
    userId,
    result.metrics.tokens_in,
    result.metrics.tokens_out,
    result.metrics.cost_estimate_usd
  ).catch(() => {});

  return c.json({
    application_id: appId,
    analysis: result.analysis,
    metrics: result.metrics,
    updated_at: now,
  });
});

export default match;
