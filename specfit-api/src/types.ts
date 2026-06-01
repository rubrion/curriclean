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

export interface MatchAnalysis {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  interview_questions: string[];
}

export interface MatchMetrics {
  model: string;
  tokens_in: number;
  tokens_out: number;
  latency_ms: number;
  cost_estimate_usd: number;
  cached: boolean;
  cache_key: string;
}

export interface MatchResult {
  analysis: MatchAnalysis;
  metrics: MatchMetrics;
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
  OPENROUTER_API_KEY?: string;

  // Vars (non-sensitive, set in wrangler.jsonc)
  DAILY_TOKEN_BUDGET: string;
  CV_PDF_MAX_BYTES: string;
  FRONTEND_URL: string;
  OPENROUTER_MODEL: string;
  OPENROUTER_BASE_URL: string;
}

// ── Hono context variable types ───────────────────────────────────────────────

export interface HonoVariables {
  userId: string;
}
