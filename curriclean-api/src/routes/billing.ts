import { Hono } from "hono";
import { z } from "zod";
import { Env, HonoVariables } from "../types";
import { jwtMiddleware } from "../lib/auth";
import { creditLeft, dailyCredit, isUnlimited, Pack, PACKS, PRICES } from "../services/credits";
import { openCheckout, stripeConfigured } from "../services/stripe";

const billing = new Hono<{ Bindings: Env; Variables: HonoVariables }>();
billing.use("*", jwtMiddleware());

// ── GET /billing — wallet, today's free credit, packs ─────────────────────────────

billing.get("/", async (c) => {
  const userId = c.get("userId");
  const [{ daily, wallet }, unlimited] = await Promise.all([
    creditLeft(c.env, userId),
    isUnlimited(c.env, userId),
  ]);
  return c.json({
    unlimited,
    credits: wallet,
    daily_credit_left: daily,
    daily_credit: dailyCredit(c.env),
    prices: PRICES,
    packs: Object.entries(PACKS).map(([usd, n]) => ({ id: usd, usd: Number(usd), credits: n })),
    checkout_enabled: stripeConfigured(c.env),
    publishable_key: c.env.STRIPE_PUBLISHABLE_KEY ?? null,
  });
});

// ── POST /billing/checkout — embedded Checkout session for a pack ─────────────

const CheckoutSchema = z.object({ pack: z.enum(Object.keys(PACKS) as [Pack, ...Pack[]]) });

billing.post("/checkout", async (c) => {
  if (!stripeConfigured(c.env)) return c.json({ detail: "BILLING_UNAVAILABLE" }, 503);

  const parsed = CheckoutSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ detail: "VALIDATION_ERROR" }, 422);

  const userId = c.get("userId");
  const user = await c.env.DB.prepare("SELECT id, email FROM users WHERE id = ?")
    .bind(userId)
    .first<{ id: string; email: string }>();
  if (!user) return c.json({ detail: "UNAUTHORIZED" }, 401);

  // Come back to the page that opened checkout (prod frontend, or localhost in dev).
  const origin = c.req.header("Origin");
  const base =
    origin && (origin === c.env.FRONTEND_URL || /^https?:\/\/localhost(:\d+)?$/.test(origin))
      ? origin
      : c.env.FRONTEND_URL;

  try {
    const { secret, ref } = await openCheckout(c.env, user, parsed.data.pack, `${base}/billing`);
    return c.json({ client_secret: secret, ref });
  } catch (err) {
    console.error("[billing] checkout failed:", err instanceof Error ? err.message : err);
    return c.json({ detail: "CHECKOUT_FAILED" }, 502);
  }
});

// ── GET /billing/payments/:ref — whether the webhook credited it yet ──────────

billing.get("/payments/:ref", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT id, pack, credits, status, paid_at FROM payments WHERE id = ? AND user_id = ?"
  )
    .bind(c.req.param("ref"), c.get("userId"))
    .first();
  if (!row) return c.json({ detail: "NOT_FOUND" }, 404);
  return c.json(row);
});

// ── GET /billing/history — credit movements ───────────────────────────────────

billing.get("/history", async (c) => {
  const limit = Math.min(parseInt(c.req.query("limit") ?? "50", 10), 200);
  const { results } = await c.env.DB.prepare(
    "SELECT ref, credits, kind, note, created_at FROM ledger WHERE user_id = ? ORDER BY created_at DESC LIMIT ?"
  )
    .bind(c.get("userId"), limit)
    .all();
  return c.json(results);
});

export default billing;
