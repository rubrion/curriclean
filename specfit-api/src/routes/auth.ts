import { Hono } from "hono";
import { z } from "zod";
import { Env, HonoVariables, UserOut, UserRow } from "../types";
import { signJwt, safeCompare } from "../lib/auth";
import { hashPassword, verifyPassword } from "../lib/password";
import { sendVerifyEmail, sendResetEmail } from "../lib/email";

const auth = new Hono<{ Bindings: Env; Variables: HonoVariables }>();

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// ── Helpers ───────────────────────────────────────────────────────────────────

function now(): string {
  return new Date().toISOString();
}

function userOut(row: UserRow): UserOut {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    image: row.image,
    email_verified: row.email_verified !== null,
  };
}

async function mintToken(db: D1Database, identifier: string): Promise<string> {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(48)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const expires = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

  await db
    .prepare(
      "INSERT OR REPLACE INTO verification_tokens (identifier, token, expires) VALUES (?, ?, ?)"
    )
    .bind(identifier, token, expires)
    .run();

  return token;
}

async function consumeToken(
  db: D1Database,
  identifier: string,
  token: string
): Promise<boolean> {
  const row = await db
    .prepare("SELECT expires FROM verification_tokens WHERE identifier = ? AND token = ?")
    .bind(identifier, token)
    .first<{ expires: string }>();

  if (!row) return false;
  if (new Date(row.expires) < new Date()) {
    await db
      .prepare("DELETE FROM verification_tokens WHERE identifier = ? AND token = ?")
      .bind(identifier, token)
      .run();
    return false;
  }

  await db
    .prepare("DELETE FROM verification_tokens WHERE identifier = ? AND token = ?")
    .bind(identifier, token)
    .run();

  return true;
}

// ── POST /auth/register ───────────────────────────────────────────────────────

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  name: z.string().max(255).optional(),
});

auth.post("/register", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ detail: "VALIDATION_ERROR", errors: parsed.error.flatten() }, 422);
  }

  const { email, password, name } = parsed.data;
  const existing = await c.env.DB.prepare("SELECT id, email_verified FROM users WHERE email = ?")
    .bind(email)
    .first<{ id: string; email_verified: string | null }>();

  if (existing?.email_verified) {
    // Already verified — silently return ok (no user enumeration)
    return c.json({ status: "ok" }, 201);
  }

  const n = now();
  let userId: string;

  if (existing) {
    // Re-send verification for unverified account
    userId = existing.id;
  } else {
    userId = crypto.randomUUID();
    const hash = await hashPassword(password);
    await c.env.DB.prepare(
      "INSERT INTO users (id, email, password_hash, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    )
      .bind(userId, email, hash, name ?? null, n, n)
      .run();
  }

  const token = await mintToken(c.env.DB, `verify:${email}`);
  await sendVerifyEmail({
    apiKey: c.env.RESEND_API_KEY,
    to: email,
    token,
    frontendUrl: c.env.FRONTEND_URL,
  }).catch(() => {
    // Non-fatal: user can request re-send; don't leak email errors
  });

  return c.json({ status: "ok" }, 201);
});

// ── POST /auth/verify ─────────────────────────────────────────────────────────

const VerifySchema = z.object({ token: z.string() });

auth.post("/verify", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = VerifySchema.safeParse(body);
  if (!parsed.success) return c.json({ detail: "VALIDATION_ERROR" }, 422);

  // Find which email this token belongs to
  const row = await c.env.DB.prepare(
    "SELECT identifier FROM verification_tokens WHERE token = ?"
  )
    .bind(parsed.data.token)
    .first<{ identifier: string }>();

  if (!row || !row.identifier.startsWith("verify:")) {
    return c.json({ detail: "INVALID_OR_EXPIRED_TOKEN" }, 400);
  }

  const email = row.identifier.slice("verify:".length);
  const valid = await consumeToken(c.env.DB, row.identifier, parsed.data.token);
  if (!valid) return c.json({ detail: "INVALID_OR_EXPIRED_TOKEN" }, 400);

  const user = await c.env.DB.prepare("SELECT id FROM users WHERE email = ?")
    .bind(email)
    .first<{ id: string }>();
  if (!user) return c.json({ detail: "USER_NOT_FOUND" }, 400);

  await c.env.DB.prepare("UPDATE users SET email_verified = ?, updated_at = ? WHERE id = ?")
    .bind(now(), now(), user.id)
    .run();

  return c.json({ status: "ok" });
});

// ── POST /auth/login ──────────────────────────────────────────────────────────

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

auth.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) return c.json({ detail: "VALIDATION_ERROR" }, 422);

  const { email, password } = parsed.data;
  const user = await c.env.DB.prepare("SELECT * FROM users WHERE email = ?")
    .bind(email)
    .first<UserRow>();

  if (!user || !user.password_hash) {
    return c.json({ detail: "INVALID_CREDENTIALS" }, 401);
  }

  const match = await verifyPassword(password, user.password_hash);
  if (!match) return c.json({ detail: "INVALID_CREDENTIALS" }, 401);

  if (!user.email_verified) {
    return c.json({ detail: "EMAIL_NOT_VERIFIED" }, 403);
  }

  const token = await signJwt({ sub: user.id }, c.env.JWT_SECRET);
  return c.json({ token, user: userOut(user) });
});

// ── POST /auth/forgot ─────────────────────────────────────────────────────────

const ForgotSchema = z.object({ email: z.string().email() });

auth.post("/forgot", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = ForgotSchema.safeParse(body);
  if (!parsed.success) return c.json({ detail: "VALIDATION_ERROR" }, 422);

  const { email } = parsed.data;
  const user = await c.env.DB.prepare(
    "SELECT id FROM users WHERE email = ? AND email_verified IS NOT NULL"
  )
    .bind(email)
    .first<{ id: string }>();

  if (user) {
    const token = await mintToken(c.env.DB, `reset:${email}`);
    await sendResetEmail({
      apiKey: c.env.RESEND_API_KEY,
      to: email,
      token,
      frontendUrl: c.env.FRONTEND_URL,
    }).catch(() => {});
  }

  return c.json({ status: "ok" });
});

// ── POST /auth/reset ──────────────────────────────────────────────────────────

const ResetSchema = z.object({
  token: z.string(),
  password: z.string().min(8).max(200),
});

auth.post("/reset", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = ResetSchema.safeParse(body);
  if (!parsed.success) return c.json({ detail: "VALIDATION_ERROR" }, 422);

  const { token, password } = parsed.data;

  const row = await c.env.DB.prepare(
    "SELECT identifier FROM verification_tokens WHERE token = ?"
  )
    .bind(token)
    .first<{ identifier: string }>();

  if (!row || !row.identifier.startsWith("reset:")) {
    return c.json({ detail: "INVALID_OR_EXPIRED_TOKEN" }, 400);
  }

  const email = row.identifier.slice("reset:".length);
  const valid = await consumeToken(c.env.DB, row.identifier, token);
  if (!valid) return c.json({ detail: "INVALID_OR_EXPIRED_TOKEN" }, 400);

  const user = await c.env.DB.prepare("SELECT id FROM users WHERE email = ?")
    .bind(email)
    .first<{ id: string }>();
  if (!user) return c.json({ detail: "USER_NOT_FOUND" }, 400);

  const hash = await hashPassword(password);
  await c.env.DB.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?")
    .bind(hash, now(), user.id)
    .run();

  return c.json({ status: "ok" });
});

// ── POST /auth/oauth-upsert ───────────────────────────────────────────────────

const OAuthUpsertSchema = z.object({
  email: z.string().email(),
  name: z.string().max(255).optional(),
  image: z.string().url().optional(),
});

auth.post("/oauth-upsert", async (c) => {
  const secret = c.req.header("X-Auth-Secret");
  if (!c.env.AUTH_SHARED_SECRET) {
    return c.json({ detail: "AUTH_SHARED_SECRET_NOT_CONFIGURED" }, 503);
  }
  if (!secret || !safeCompare(secret, c.env.AUTH_SHARED_SECRET)) {
    return c.json({ detail: "FORBIDDEN" }, 403);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = OAuthUpsertSchema.safeParse(body);
  if (!parsed.success) return c.json({ detail: "VALIDATION_ERROR" }, 422);

  const { email, name, image } = parsed.data;
  const n = now();

  let user = await c.env.DB.prepare("SELECT * FROM users WHERE email = ?")
    .bind(email)
    .first<UserRow>();

  if (user) {
    await c.env.DB.prepare(
      "UPDATE users SET name = ?, image = ?, email_verified = COALESCE(email_verified, ?), updated_at = ? WHERE id = ?"
    )
      .bind(name ?? user.name, image ?? user.image, n, n, user.id)
      .run();
    user = (await c.env.DB.prepare("SELECT * FROM users WHERE id = ?")
      .bind(user.id)
      .first<UserRow>())!;
  } else {
    const id = crypto.randomUUID();
    await c.env.DB.prepare(
      "INSERT INTO users (id, email, name, image, email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
      .bind(id, email, name ?? null, image ?? null, n, n, n)
      .run();
    user = (await c.env.DB.prepare("SELECT * FROM users WHERE id = ?")
      .bind(id)
      .first<UserRow>())!;
  }

  const token = await signJwt({ sub: user.id }, c.env.JWT_SECRET);
  return c.json({ token, user: userOut(user) });
});

export default auth;
