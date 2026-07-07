import { Env, MatchAnalysis, MatchResult } from "../types";

// ── Per-model cost table (USD per 1M tokens) ─────────────────────────────────

const COST_TABLE: Record<string, { in: number; out: number }> = {
  "openai/gpt-4o-mini":                 { in: 0.15,  out: 0.60  },
  "openai/gpt-4o":                      { in: 2.50,  out: 10.00 },
  "anthropic/claude-3.5-sonnet":        { in: 3.00,  out: 15.00 },
  "anthropic/claude-3.5-haiku":         { in: 0.80,  out: 4.00  },
  "google/gemini-2.0-flash-001":        { in: 0.10,  out: 0.40  },
  "meta-llama/llama-3.3-70b-instruct":  { in: 0.12,  out: 0.30  },
  // Workers AI models billed via Cloudflare AI account — set to $0 here
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast": { in: 0, out: 0 },
};

function estimateCost(model: string, tokensIn: number, tokensOut: number): number {
  const rate = COST_TABLE[model] ?? { in: 0, out: 0 };
  return (tokensIn * rate.in + tokensOut * rate.out) / 1_000_000;
}

// ── SHA-256 cache key ─────────────────────────────────────────────────────────

export async function buildCacheKey(
  model: string,
  jobDescription: string,
  cvText: string
): Promise<string> {
  const data = new TextEncoder().encode(`${model}||${jobDescription}||${cvText}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a senior technical recruiter and career coach.
Given a job description and a candidate's CV, produce a structured JSON fit analysis.

Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "score": <integer 0-100>,
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "..."],
  "gaps": ["<gap 1>", "..."],
  "interview_questions": ["<question 1>", "..."]
}

Scoring rubric:
- 90-100: Exceptional match, candidate exceeds requirements
- 70-89:  Strong match, minor gaps
- 50-69:  Moderate match, several gaps but transferable skills
- 30-49:  Weak match, significant gaps
- 0-29:   Poor match, fundamentally misaligned

Provide 3-5 items in each array.`;

// ── Workers AI inference ──────────────────────────────────────────────────────

async function runWorkersAI(
  ai: Ai,
  jobDescription: string,
  cvText: string
): Promise<{ analysis: MatchAnalysis; tokensIn: number; tokensOut: number }> {
  const messages: RoleScopedChatInput[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `JOB DESCRIPTION:\n${jobDescription}\n\nCANDIDATE CV:\n${cvText}`,
    },
  ];

  const response = await ai.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
    messages,
    response_format: { type: "json_object" },
    max_tokens: 1024,
  } as Parameters<typeof ai.run>[1]);

  const raw = (response as { response?: string }).response ?? "";

  let analysis: MatchAnalysis;
  try {
    analysis = JSON.parse(raw) as MatchAnalysis;
  } catch {
    throw new Error(`LLM returned unparseable JSON: ${raw.slice(0, 200)}`);
  }

  // Workers AI doesn't always surface token counts — use estimation
  const tokensIn = Math.ceil((SYSTEM_PROMPT.length + jobDescription.length + cvText.length) / 4);
  const tokensOut = Math.ceil(raw.length / 4);

  return { analysis, tokensIn, tokensOut };
}

// ── OpenRouter fallback ───────────────────────────────────────────────────────

async function runOpenRouter(
  env: Env,
  jobDescription: string,
  cvText: string
): Promise<{ analysis: MatchAnalysis; tokensIn: number; tokensOut: number }> {
  const resp = await fetch(`${env.OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.OPENROUTER_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `JOB DESCRIPTION:\n${jobDescription}\n\nCANDIDATE CV:\n${cvText}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1024,
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`OpenRouter error ${resp.status}: ${body.slice(0, 200)}`);
  }

  const data = (await resp.json()) as {
    choices: { message: { content: string } }[];
    usage?: { prompt_tokens: number; completion_tokens: number };
  };

  const raw = data.choices[0]?.message?.content ?? "";
  const analysis = JSON.parse(raw) as MatchAnalysis;
  const tokensIn = data.usage?.prompt_tokens ?? 0;
  const tokensOut = data.usage?.completion_tokens ?? 0;

  return { analysis, tokensIn, tokensOut };
}

// ── Public entrypoint ─────────────────────────────────────────────────────────

export async function runMatch(
  env: Env,
  jobDescription: string,
  cvText: string
): Promise<MatchResult> {
  const model = env.OPENROUTER_API_KEY
    ? env.OPENROUTER_MODEL
    : "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

  const cacheKey = await buildCacheKey(model, jobDescription, cvText);
  const start = Date.now();

  let analysis: MatchAnalysis;
  let tokensIn: number;
  let tokensOut: number;

  try {
    if (env.OPENROUTER_API_KEY) {
      ({ analysis, tokensIn, tokensOut } = await runOpenRouter(env, jobDescription, cvText));
    } else {
      ({ analysis, tokensIn, tokensOut } = await runWorkersAI(env.AI, jobDescription, cvText));
    }
  } catch (err) {
    throw new LlmError(err instanceof Error ? err.message : "LLM call failed");
  }

  const latencyMs = Date.now() - start;
  const costEstimateUsd = estimateCost(model, tokensIn, tokensOut);

  return {
    analysis,
    metrics: {
      model,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      latency_ms: latencyMs,
      cost_estimate_usd: costEstimateUsd,
      cached: false,
      cache_key: cacheKey,
    },
  };
}

export class LlmError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmError";
  }
}
