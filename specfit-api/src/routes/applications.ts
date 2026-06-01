import { Hono } from "hono";
import { z } from "zod";
import { ApplicationRow, ApplicationStatus, Env, HonoVariables } from "../types";
import { jwtMiddleware } from "../lib/auth";

const applications = new Hono<{ Bindings: Env; Variables: HonoVariables }>();
applications.use("*", jwtMiddleware());

const STATUS_VALUES: ApplicationStatus[] = [
  "saved",
  "applied",
  "interviewing",
  "offer",
  "rejected",
  "withdrawn",
];

// ── Row → API response ────────────────────────────────────────────────────────

function rowToResponse(row: ApplicationRow) {
  return {
    id: row.id,
    company: row.company,
    title: row.title,
    description: row.description,
    applied_at: row.applied_at,
    status: row.status,
    analysis: row.analysis ? JSON.parse(row.analysis) : null,
    analysis_hash: row.analysis_hash,
    analysis_updated_at: row.analysis_updated_at,
    suggested_profiles: row.suggested_profiles ? JSON.parse(row.suggested_profiles) : null,
    suggested_profiles_updated_at: row.suggested_profiles_updated_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function now(): string {
  return new Date().toISOString();
}

// ── POST /applications ────────────────────────────────────────────────────────

const CreateSchema = z.object({
  company: z.string().min(1).max(255),
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  applied_at: z.string().datetime(),
  status: z.enum(["saved", "applied", "interviewing", "offer", "rejected", "withdrawn"]).default("saved"),
});

applications.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ detail: "VALIDATION_ERROR", errors: parsed.error.flatten() }, 422);
  }

  const { company, title, description, applied_at, status } = parsed.data;
  const id = crypto.randomUUID();
  const n = now();
  const userId = c.get("userId");

  await c.env.DB.prepare(
    `INSERT INTO applications (id, user_id, company, title, description, applied_at, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, userId, company, title, description, applied_at, status, n, n)
    .run();

  const row = await c.env.DB.prepare("SELECT * FROM applications WHERE id = ?")
    .bind(id)
    .first<ApplicationRow>();

  return c.json(rowToResponse(row!), 201);
});

// ── GET /applications ─────────────────────────────────────────────────────────

applications.get("/", async (c) => {
  const userId = c.get("userId");
  const statusFilter = c.req.query("status");
  const limit = Math.min(parseInt(c.req.query("limit") ?? "100", 10), 500);
  const offset = parseInt(c.req.query("offset") ?? "0", 10);

  if (
    statusFilter !== undefined &&
    !STATUS_VALUES.includes(statusFilter as ApplicationStatus)
  ) {
    return c.json({ detail: "INVALID_STATUS" }, 422);
  }

  let rows: ApplicationRow[];
  if (statusFilter) {
    const result = await c.env.DB.prepare(
      "SELECT * FROM applications WHERE user_id = ? AND status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?"
    )
      .bind(userId, statusFilter, limit, offset)
      .all<ApplicationRow>();
    rows = result.results;
  } else {
    const result = await c.env.DB.prepare(
      "SELECT * FROM applications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?"
    )
      .bind(userId, limit, offset)
      .all<ApplicationRow>();
    rows = result.results;
  }

  return c.json(rows.map(rowToResponse));
});

// ── GET /applications/:id ─────────────────────────────────────────────────────

applications.get("/:id", async (c) => {
  const userId = c.get("userId");
  const row = await c.env.DB.prepare(
    "SELECT * FROM applications WHERE id = ? AND user_id = ?"
  )
    .bind(c.req.param("id"), userId)
    .first<ApplicationRow>();

  if (!row) return c.json({ detail: "NOT_FOUND" }, 404);
  return c.json(rowToResponse(row));
});

// ── PATCH /applications/:id ───────────────────────────────────────────────────

const UpdateSchema = z.object({
  company: z.string().min(1).max(255).optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  applied_at: z.string().datetime().optional(),
  status: z.enum(["saved", "applied", "interviewing", "offer", "rejected", "withdrawn"]).optional(),
});

applications.patch("/:id", async (c) => {
  const userId = c.get("userId");
  const appId = c.req.param("id");

  const existing = await c.env.DB.prepare(
    "SELECT * FROM applications WHERE id = ? AND user_id = ?"
  )
    .bind(appId, userId)
    .first<ApplicationRow>();
  if (!existing) return c.json({ detail: "NOT_FOUND" }, 404);

  const body = await c.req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ detail: "VALIDATION_ERROR", errors: parsed.error.flatten() }, 422);
  }

  const updates = parsed.data;
  if (Object.keys(updates).length === 0) {
    return c.json(rowToResponse(existing));
  }

  const setClauses: string[] = [];
  const values: unknown[] = [];

  if (updates.company !== undefined) { setClauses.push("company = ?"); values.push(updates.company); }
  if (updates.title !== undefined) { setClauses.push("title = ?"); values.push(updates.title); }
  if (updates.description !== undefined) { setClauses.push("description = ?"); values.push(updates.description); }
  if (updates.applied_at !== undefined) { setClauses.push("applied_at = ?"); values.push(updates.applied_at); }
  if (updates.status !== undefined) { setClauses.push("status = ?"); values.push(updates.status); }

  setClauses.push("updated_at = ?");
  values.push(now());
  values.push(appId);
  values.push(userId);

  await c.env.DB.prepare(
    `UPDATE applications SET ${setClauses.join(", ")} WHERE id = ? AND user_id = ?`
  )
    .bind(...values)
    .run();

  const updated = await c.env.DB.prepare(
    "SELECT * FROM applications WHERE id = ?"
  )
    .bind(appId)
    .first<ApplicationRow>();

  return c.json(rowToResponse(updated!));
});

// ── DELETE /applications/:id ──────────────────────────────────────────────────

applications.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const appId = c.req.param("id");

  const existing = await c.env.DB.prepare(
    "SELECT id FROM applications WHERE id = ? AND user_id = ?"
  )
    .bind(appId, userId)
    .first<{ id: string }>();
  if (!existing) return c.json({ detail: "NOT_FOUND" }, 404);

  await c.env.DB.prepare("DELETE FROM applications WHERE id = ? AND user_id = ?")
    .bind(appId, userId)
    .run();

  return new Response(null, { status: 204 });
});

export default applications;
