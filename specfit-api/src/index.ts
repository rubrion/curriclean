import { Hono } from "hono";
import { cors } from "hono/cors";
import { Env, HonoVariables } from "./types";
import authRoutes from "./routes/auth";
import applicationRoutes from "./routes/applications";
import matchRoutes from "./routes/match";
import cvRoutes from "./routes/cv";
import suggestionRoutes from "./routes/suggestions";

const app = new Hono<{ Bindings: Env; Variables: HonoVariables }>();

// ── CORS ──────────────────────────────────────────────────────────────────────

app.use(
  "*",
  cors({
    origin: (origin, c) => {
      const allowed = c.env.FRONTEND_URL ?? "http://localhost:3000";
      // Allow exact match or any localhost port in dev
      if (origin === allowed) return origin;
      if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return origin;
      return null;
    },
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Auth-Secret"],
    exposeHeaders: ["Content-Type"],
    credentials: true,
    maxAge: 86400,
  })
);

// ── Global error handler ──────────────────────────────────────────────────────

app.onError((err, c) => {
  console.error("[unhandled]", err);
  return c.json({ detail: "INTERNAL_SERVER_ERROR" }, 500);
});

app.notFound((c) => c.json({ detail: "NOT_FOUND" }, 404));

// ── Health check ──────────────────────────────────────────────────────────────

app.get("/health", (c) => c.json({ status: "ok" }));

// ── Route mounting ────────────────────────────────────────────────────────────

app.route("/auth", authRoutes);
app.route("/applications", applicationRoutes);
app.route("/applications", matchRoutes);
app.route("/applications", suggestionRoutes);
app.route("/cv", cvRoutes);

export default app;
