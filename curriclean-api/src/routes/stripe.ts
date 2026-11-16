// POST /stripe/webhook (signed with the endpoint's secret).
// checkout.session.completed / async_payment_succeeded credit the pack to the
// account that opened the checkout; a refund or a dispute takes its share back.
// Each runs once, however often Stripe retries.
import { Hono } from "hono";
import { Env } from "../types";
import { credit, refOf, takeBack, verifySignature } from "../services/stripe";

type Event = {
  type: string;
  data: {
    object: {
      id: string;
      payment_status?: string;
      client_reference_id?: string;
      metadata?: { ref?: string };
      amount?: number;
      amount_refunded?: number;
      charge?: string;
      payment_intent?: string | null;
    };
  };
};

const stripeRoutes = new Hono<{ Bindings: Env }>();

stripeRoutes.post("/webhook", async (c) => {
  const body = await c.req.text();
  if (!(await verifySignature(c.env, c.req.header("stripe-signature"), body))) {
    return c.text("bad signature", 401);
  }
  const { type, data } = JSON.parse(body) as Event;
  const o = data.object;
  try {
    if (
      (type === "checkout.session.completed" || type === "checkout.session.async_payment_succeeded") &&
      o.payment_status === "paid" &&
      o.client_reference_id
    ) {
      await credit(c.env, o.client_reference_id);
    } else if (type === "charge.refunded" && o.amount) {
      const ref = await refOf(c.env, o);
      if (ref) await takeBack(c.env, ref, (o.amount_refunded ?? 0) / o.amount, `${o.id}:`, `${o.id}:${o.amount_refunded}`);
    } else if (type === "charge.dispute.created" && o.charge) {
      // A dispute names its charge; the charge (or its payment) names the pack.
      const ref = await refOf(c.env, o.charge);
      if (ref) await takeBack(c.env, ref, 1, `${o.charge}:`, `${o.charge}:dispute`);
    }
  } catch (e) {
    // A 5xx makes Stripe retry later.
    console.error(`[stripe] webhook ${type} failed: ${(e as Error).message}`);
    return c.text("retry", 500);
  }
  return c.text("ok");
});

export default stripeRoutes;
