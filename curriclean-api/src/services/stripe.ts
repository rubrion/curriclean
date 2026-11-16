// Credit top-ups through Stripe, ported from Rubry's payments: CurriClean opens
// an embedded Checkout session for a signed-in account; its `payments` row
// (keyed by our own ref, carried in the session and the payment's metadata) is
// credited once by the webhook, and refunds or disputes take their share back.
import { Env } from "../types";
import { depositStatement, Pack, PACKS } from "./credits";
import { safeCompare } from "../lib/auth";

const STRIPE_VERSION = "2026-09-30.endive";

export function stripeConfigured(env: Env) {
  return Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET && env.STRIPE_PUBLISHABLE_KEY);
}

const hex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

// Form-encode nested params the way Stripe's API reads them (a[b][0][c]=…).
function form(o: Record<string, unknown>, prefix = "", out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v && typeof v === "object") form(v as Record<string, unknown>, key, out);
    else out.append(key, String(v));
  }
  return out;
}

async function stripe<T>(env: Env, method: "GET" | "POST", path: string, params?: Record<string, unknown>) {
  const q = params ? form(params) : undefined;
  const r = await fetch(`https://api.stripe.com/v1${path}${method === "GET" && q ? `?${q}` : ""}`, {
    method,
    headers: { authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, "stripe-version": STRIPE_VERSION },
    body: method === "POST" ? q : undefined,
    signal: AbortSignal.timeout(10_000),
  });
  if (!r.ok) throw new Error(`Stripe ${method} ${path}: ${r.status} ${(await r.text()).slice(0, 200)}`);
  return (await r.json()) as T;
}

/** How embedded Checkout looks inside the billing dialog: CurriClean's name and colours. */
const BRANDING = {
  display_name: "CurriClean",
  background_color: "#ffffff",
  button_color: "#c42524",
  border_style: "rounded",
};

/**
 * A Checkout session for one pack, bound to the account, embedded in the
 * billing page: the page mounts it with `secret`. A payment method that needs a
 * bank's page comes back to `back`.
 */
export async function openCheckout(env: Env, user: { id: string; email: string }, pack: Pack, back: string) {
  // Prices are found by lookup key (curriclean_credit_<usd>), the same in test and live.
  const prices = await stripe<{ data: { id: string }[] }>(env, "GET", "/prices", {
    "lookup_keys[]": `curriclean_credit_${pack}`,
    active: true,
  });
  const price = prices.data[0]?.id;
  if (!price) throw new Error(`No Stripe price curriclean_credit_${pack}`);

  const ref = `pay_${hex(crypto.getRandomValues(new Uint8Array(12)).buffer)}`;
  const meta = { ref, user_id: user.id, pack };
  const session = await stripe<{ client_secret: string }>(env, "POST", "/checkout/sessions", {
    mode: "payment",
    ui_mode: "embedded_page",
    redirect_on_completion: "if_required",
    return_url: `${back}?paid=${ref}`,
    line_items: { 0: { price, quantity: 1 } },
    client_reference_id: ref,
    customer_email: user.email,
    metadata: meta,
    // On the payment too, so a refund or dispute (which name the charge) finds the row.
    payment_intent_data: { metadata: meta, receipt_email: user.email, statement_descriptor_suffix: "CURRICLEAN" },
    branding_settings: BRANDING,
  });

  await env.DB.prepare(
    "INSERT INTO payments (id, user_id, pack, credits, status, created_at) VALUES (?, ?, ?, ?, 'open', ?)"
  )
    .bind(ref, user.id, pack, PACKS[pack], new Date().toISOString())
    .run();

  return { secret: session.client_secret, ref };
}

/** Stripe-Signature: `t=…,v1=…` (several v1 while a secret rotates), HMAC-SHA256 of `t.body`, within five minutes. */
export async function verifySignature(env: Env, header: string | null | undefined, body: string) {
  if (!header || !env.STRIPE_WEBHOOK_SECRET) return false;
  const parts = header.split(",").map((p) => p.split("=") as [string, string]);
  const t = parts.find(([k]) => k === "t")?.[1];
  const sigs = parts.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!t || !sigs.length || Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(env.STRIPE_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const want = hex(await crypto.subtle.sign("HMAC", key, enc.encode(`${t}.${body}`)));
  return sigs.some((s) => safeCompare(s, want));
}

type ChargeLike = { id: string; metadata?: { ref?: string }; payment_intent?: string | null };

/** The pack a charge paid for: our ref, from the charge's metadata or its payment's. */
export async function refOf(env: Env, charge: string | ChargeLike) {
  const c = typeof charge === "string" ? await stripe<ChargeLike>(env, "GET", `/charges/${charge}`) : charge;
  if (c.metadata?.ref) return c.metadata.ref;
  if (!c.payment_intent) return undefined;
  return (await stripe<{ metadata?: { ref?: string } }>(env, "GET", `/payment_intents/${c.payment_intent}`)).metadata
    ?.ref;
}

/** A paid session: credit its pack to the account that opened it, once. */
export async function credit(env: Env, ref: string) {
  const now = new Date().toISOString();
  const row = await env.DB.prepare(
    "UPDATE payments SET status = 'paid', paid_at = ? WHERE id = ? AND status = 'open' RETURNING user_id, credits"
  )
    .bind(now, ref)
    .first<{ user_id: string; credits: number }>();
  if (!row) return false;
  await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO ledger (ref, user_id, credits, kind, note, created_at) VALUES (?, ?, ?, 'topup', ?, ?)"
    ).bind(ref, row.user_id, row.credits, `Credit pack`, now),
    depositStatement(env, row.user_id, row.credits),
  ]);
  return true;
}

/**
 * Take back `share` (0–1) of a paid pack, once per `key`. A charge refunded in
 * parts reports its running total, so `key` carries it and the earlier takes
 * (same `group` prefix) are subtracted.
 */
export async function takeBack(env: Env, ref: string, share: number, group: string, key: string) {
  const pay = await env.DB.prepare("SELECT user_id, credits FROM payments WHERE id = ? AND status = 'paid'")
    .bind(ref)
    .first<{ user_id: string; credits: number }>();
  if (!pay) return false;
  const taken = await env.DB.prepare("SELECT COALESCE(-SUM(credits), 0) AS taken FROM ledger WHERE ref LIKE ?")
    .bind(`${group}%`)
    .first<{ taken: number }>();
  const n = Math.max(0, Math.round(pay.credits * Math.min(1, share)) - (taken?.taken ?? 0));
  if (!n) return false;
  const now = new Date().toISOString();
  const ins = await env.DB.prepare(
    `INSERT INTO ledger (ref, user_id, credits, kind, note, created_at) VALUES (?, ?, ?, 'refund', ?, ?)
     ON CONFLICT (ref) DO NOTHING`
  )
    .bind(key, pay.user_id, -n, "Refund", now)
    .run();
  if (!(ins.meta.changes ?? 0)) return false;
  await env.DB.prepare("UPDATE wallets SET credits = MAX(credits - ?, 0), updated_at = ? WHERE user_id = ?")
    .bind(n, now, pay.user_id)
    .run();
  return true;
}
