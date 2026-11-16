export type ApplicationStatus =
  | "saved"
  | "applied"
  | "interviewing"
  | "offer"
  | "rejected"
  | "withdrawn";

// ── Database row shapes ───────────────────────────────────────────────────────

export interface UserRow {
  id: string;
  email: string;
  email_verified: string | null;
  password_hash: string | null;
  name: string | null;
  image: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationRow {
  id: string;
  user_id: string;
  company: string;
  title: string;
  description: string;
  applied_at: string;
  status: ApplicationStatus;
  analysis: string | null;
  analysis_hash: string | null;
  analysis_updated_at: string | null;
  suggested_profiles: string | null;
  suggested_profiles_updated_at: string | null;
  tailored: string | null;
  tailored_hash: string | null;
  tailored_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TokenUsageRow {
  id: string;
  user_id: string;
  day: string;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  runs: number;
  created_at: string;
  updated_at: string;
}

export interface VerificationTokenRow {
  identifier: string;
  token: string;
  expires: string;
}

// ── API response shapes ───────────────────────────────────────────────────────

export interface UserOut {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  email_verified: boolean;
}

export interface ProfileHit {
  url: string;
  title: string;
  description: string;
}

// ── Cloudflare bindings ───────────────────────────────────────────────────────

export interface Env {
  // Bindings
  DB: D1Database;
  BUDGET_KV: KVNamespace;
  AI: Ai;

  // Secrets (set via wrangler secret put)
  JWT_SECRET: string;
  AUTH_SHARED_SECRET: string;
  RESEND_API_KEY: string;
  BRAVE_API_KEY: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;

  // Vars (non-sensitive, set in wrangler.jsonc)
  DAILY_TOKEN_BUDGET: string;
  CV_PDF_MAX_BYTES: string;
  FRONTEND_URL: string;
  EMAIL_FROM: string;
  FREE_DAILY_RUNS?: string;
  STRIPE_PUBLISHABLE_KEY?: string;
}

// ── Hono context variable types ───────────────────────────────────────────────

export interface HonoVariables {
  userId: string;
}
