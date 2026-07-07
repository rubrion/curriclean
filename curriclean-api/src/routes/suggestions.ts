import { Hono } from "hono";
import { ApplicationRow, Env, HonoVariables, ProfileHit } from "../types";
import { jwtMiddleware } from "../lib/auth";
import { searchLinkedInProfiles, BraveError } from "../services/brave";

const suggestions = new Hono<{ Bindings: Env; Variables: HonoVariables }>();
suggestions.use("*", jwtMiddleware());

suggestions.post("/:application_id/suggested-profiles", async (c) => {
  const userId = c.get("userId");
  const appId = c.req.param("application_id");
  const refresh = c.req.query("refresh") === "true";
  const limit = Math.min(parseInt(c.req.query("limit") ?? "10", 10), 20);

  const app = await c.env.DB.prepare(
    "SELECT * FROM applications WHERE id = ? AND user_id = ?"
  )
    .bind(appId, userId)
    .first<ApplicationRow>();

  if (!app) return c.json({ detail: "NOT_FOUND" }, 404);

  // Return cached result if available and not forcing refresh
  if (!refresh && app.suggested_profiles) {
    return c.json(JSON.parse(app.suggested_profiles));
  }

  if (!c.env.BRAVE_API_KEY) {
    // Serve cache if we have it, otherwise 503
    if (app.suggested_profiles) {
      return c.json(JSON.parse(app.suggested_profiles));
    }
    return c.json({ detail: "BRAVE_NOT_CONFIGURED" }, 503);
  }

  let hits: ProfileHit[];
  try {
    hits = await searchLinkedInProfiles(c.env.BRAVE_API_KEY, app.title, app.company, limit);
  } catch (err) {
    if (err instanceof BraveError) {
      // Serve stale cache on Brave failure
      if (app.suggested_profiles) {
        return c.json(JSON.parse(app.suggested_profiles));
      }
      return c.json({ detail: "BRAVE_FETCH_FAILED" }, 502);
    }
    throw err;
  }

  const payload = { hits };
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `UPDATE applications
     SET suggested_profiles = ?, suggested_profiles_updated_at = ?, updated_at = ?
     WHERE id = ?`
  )
    .bind(JSON.stringify(payload), now, now, appId)
    .run();

  return c.json(payload);
});

export default suggestions;
