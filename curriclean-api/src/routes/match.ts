import { Hono } from "hono";
import { z } from "zod";
import { ApplicationRow, Env, HonoVariables } from "../types";
import { jwtMiddleware } from "../lib/auth";
import { buildCacheKey, MatchAnalysis, runMatch, runTailor, TailoredCv } from "../services/llm";
import { metered } from "../services/metering";
import { parseAnalysis } from "./applications";

const match = new Hono<{ Bindings: Env; Variables: HonoVariables }>();
match.use("*", jwtMiddleware());

const CvRequestSchema = z.object({
  cv_text: z.string().min(50),
  language: z.enum(["en", "pt"]).default("en"),
});

async function loadApp(env: Env, appId: string, userId: string) {
  return env.DB.prepare("SELECT * FROM applications WHERE id = ? AND user_id = ?")
    .bind(appId, userId)
    .first<ApplicationRow>();
}

// ── POST /applications/:id/match ──────────────────────────────────────────────

match.post("/:application_id/match", async (c) => {
  const userId = c.get("userId");
  const appId = c.req.param("application_id");
  const force = c.req.query("force") === "true";

  const app = await loadApp(c.env, appId, userId);
  if (!app) return c.json({ detail: "NOT_FOUND" }, 404);

  const parsed = CvRequestSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ detail: "VALIDATION_ERROR", errors: parsed.error.flatten() }, 422);
  }
  const { cv_text, language } = parsed.data;
  const cacheKey = await buildCacheKey(language, app.description, cv_text);

  // Same job + CV → return the stored analysis (free) unless force=true.
  const stored = parseAnalysis(app.analysis);
  if (!force && stored && app.analysis_hash === cacheKey) {
    return c.json({ application_id: appId, analysis: stored, updated_at: app.analysis_updated_at });
  }

  const res = await metered<MatchAnalysis>(c.env, userId, "analysis", `Match: ${app.title} at ${app.company}`, () =>
    runMatch(c.env, app.description, cv_text, language)
  );
  if (!res.ok) return c.json(res.body, res.status);

  const now = new Date().toISOString();
  await c.env.DB.prepare(
    `UPDATE applications
     SET analysis = ?, analysis_hash = ?, analysis_updated_at = ?, updated_at = ?
     WHERE id = ?`
  )
    .bind(JSON.stringify(res.data), cacheKey, now, now, appId)
    .run();

  return c.json({ application_id: appId, analysis: res.data, updated_at: now });
});

// ── POST /applications/:id/tailor ─────────────────────────────────────────────

match.post("/:application_id/tailor", async (c) => {
  const userId = c.get("userId");
  const appId = c.req.param("application_id");
  const force = c.req.query("force") === "true";

  const app = await loadApp(c.env, appId, userId);
  if (!app) return c.json({ detail: "NOT_FOUND" }, 404);

  const parsed = CvRequestSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ detail: "VALIDATION_ERROR", errors: parsed.error.flatten() }, 422);
  }
  const { cv_text, language } = parsed.data;

  const analysis = parseAnalysis(app.analysis);
  if (!analysis) return c.json({ detail: "ANALYSIS_REQUIRED" }, 409);

  const cacheKey = await buildCacheKey("tailor", language, app.description, cv_text);
  if (!force && app.tailored && app.tailored_hash === cacheKey) {
    return c.json({
      application_id: appId,
      tailored: JSON.parse(app.tailored) as TailoredCv,
      updated_at: app.tailored_updated_at,
    });
  }

  const res = await metered<TailoredCv>(c.env, userId, "tailor", `Tailored CV: ${app.title} at ${app.company}`, () =>
    runTailor(c.env, app.description, cv_text, analysis.gaps, language)
  );
  if (!res.ok) return c.json(res.body, res.status);

  const now = new Date().toISOString();
  await c.env.DB.prepare(
    `UPDATE applications
     SET tailored = ?, tailored_hash = ?, tailored_updated_at = ?, updated_at = ?
     WHERE id = ?`
  )
    .bind(JSON.stringify(res.data), cacheKey, now, now, appId)
    .run();

  return c.json({ application_id: appId, tailored: res.data, updated_at: now });
});

export default match;
