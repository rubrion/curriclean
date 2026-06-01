import { Context, MiddlewareHandler, Next } from "hono";
import { Env, HonoVariables } from "../types";

const ALG = "HS256";
const EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 days

// ── Key derivation ────────────────────────────────────────────────────────────

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

// ── Minimal JWT implementation using Web Crypto ───────────────────────────────

function b64url(data: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(data)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), "="));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export async function signJwt(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = { alg: ALG, typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claims = { iat: now, exp: now + EXPIRY_SECONDS, ...payload };

  const enc = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payloadB64 = btoa(JSON.stringify(claims)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await importKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(signingInput));

  return `${signingInput}.${b64url(sig)}`;
}

export async function verifyJwt(
  token: string,
  secret: string
): Promise<{ sub: string } & Record<string, unknown>> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("malformed token");

  const [headerB64, payloadB64, sigB64] = parts;
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await importKey(secret);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    b64urlDecode(sigB64),
    new TextEncoder().encode(signingInput)
  );
  if (!valid) throw new Error("invalid signature");

  const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadB64)));

  if (typeof payload.exp === "number" && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("token expired");
  }

  return payload;
}

// ── Middleware ────────────────────────────────────────────────────────────────

export function jwtMiddleware(): MiddlewareHandler<{
  Bindings: Env;
  Variables: HonoVariables;
}> {
  return async (c: Context<{ Bindings: Env; Variables: HonoVariables }>, next: Next) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ detail: "UNAUTHORIZED" }, 401);
    }

    const token = authHeader.slice(7);
    try {
      const payload = await verifyJwt(token, c.env.JWT_SECRET);
      if (typeof payload.sub !== "string") throw new Error("missing sub");
      c.set("userId", payload.sub);
    } catch {
      return c.json({ detail: "UNAUTHORIZED" }, 401);
    }

    return next();
  };
}

// ── Constant-time string comparison (for shared secrets) ─────────────────────

export function safeCompare(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}
