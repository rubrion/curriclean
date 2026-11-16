import { z } from "zod";
import { Env } from "../types";

/** The one model CurriClean runs, through the Workers AI binding. */
export const MODEL = "@cf/google/gemma-4-26b-a4b-it";

// ── Output schemas (validated with zod) ──────────────────────────────────────

export const MatchAnalysisSchema = z.object({
  score: z.number().int().min(0).max(100),
  summary: z.string().min(1),
  strengths: z.array(z.string().min(1)).min(1),
  gaps: z.array(z.string().min(1)).min(1),
  interview_questions: z.array(z.string().min(1)).min(1),
});
export type MatchAnalysis = z.infer<typeof MatchAnalysisSchema>;

export const TailoredCvSchema = z.object({
  headline: z.string().min(1),
  summary: z.string().min(1),
  bullets: z
    .array(
      z.object({
        original: z.string(),
        improved: z.string().min(1),
        reason: z.string().min(1),
      })
    )
    .min(1),
  keywords: z.array(z.string().min(1)),
});
export type TailoredCv = z.infer<typeof TailoredCvSchema>;

// ── SHA-256 cache key ─────────────────────────────────────────────────────────

export async function buildCacheKey(...parts: string[]): Promise<string> {
  const data = new TextEncoder().encode([MODEL, ...parts].join("||"));
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Prompts ───────────────────────────────────────────────────────────────────

const MATCH_PROMPT = `You are a senior technical recruiter and career coach.
Given a job description and a candidate's CV, produce a structured fit analysis.

Scoring rubric:
- 90-100: Exceptional match, candidate exceeds requirements
- 70-89:  Strong match, minor gaps
- 50-69:  Moderate match, several gaps but transferable skills
- 30-49:  Weak match, significant gaps
- 0-29:   Poor match, fundamentally misaligned

"summary" is a 2-3 sentence overall assessment. Provide 3-5 items in each array.
Respond with JSON only.`;

const TAILOR_PROMPT = `You are an expert CV writer.
Given a job description, a candidate's CV and the gaps found in a fit analysis,
rewrite the candidate's CV content so it targets this job, without inventing experience.

- "headline": one-line professional headline aimed at this role.
- "summary": a 3-4 sentence profile summary tailored to the job.
- "bullets": 4-6 items. "original" is a bullet or sentence from the CV (empty string if new),
  "improved" is the rewritten version using the job's language and quantified impact,
  "reason" explains in one sentence which requirement or gap it addresses.
- "keywords": 6-12 keywords from the job description the CV should contain.
Respond with JSON only.`;

const JSON_SCHEMAS = {
  match: {
    type: "object",
    properties: {
      score: { type: "integer", minimum: 0, maximum: 100 },
      summary: { type: "string" },
      strengths: { type: "array", items: { type: "string" } },
      gaps: { type: "array", items: { type: "string" } },
      interview_questions: { type: "array", items: { type: "string" } },
    },
    required: ["score", "summary", "strengths", "gaps", "interview_questions"],
  },
  tailor: {
    type: "object",
    properties: {
      headline: { type: "string" },
      summary: { type: "string" },
      bullets: {
        type: "array",
        items: {
          type: "object",
          properties: {
            original: { type: "string" },
            improved: { type: "string" },
            reason: { type: "string" },
          },
          required: ["original", "improved", "reason"],
        },
      },
      keywords: { type: "array", items: { type: "string" } },
    },
    required: ["headline", "summary", "bullets", "keywords"],
  },
} as const;

// ── Workers AI call with schema-constrained output ───────────────────────────

export interface LlmRun<T> {
  data: T;
  tokensIn: number;
  tokensOut: number;
}

type ChatOut = {
  response?: unknown;
  choices?: { message?: { content?: unknown } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
};

async function runStructured<T>(
  env: Env,
  kind: keyof typeof JSON_SCHEMAS,
  system: string,
  user: string,
  schema: z.ZodType<T>
): Promise<LlmRun<T>> {
  let lastError = "LLM call failed";

  // One retry when the model returns output that fails validation.
  for (let attempt = 0; attempt < 2; attempt++) {
    let out: ChatOut;
    try {
      out = (await env.AI.run(MODEL, {
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: kind, schema: JSON_SCHEMAS[kind], strict: true },
        },
        max_tokens: 2048,
        temperature: 0.3,
        chat_template_kwargs: { enable_thinking: false },
      } as unknown as ChatCompletionsMessagesInput)) as ChatOut;
    } catch (err) {
      throw new LlmError(err instanceof Error ? err.message : lastError);
    }

    // The binding returns either an OpenAI-style completion or { response }.
    const content = out.choices?.[0]?.message?.content ?? out.response ?? "";
    let parsedJson: unknown = content;
    if (typeof content === "string") {
      try {
        parsedJson = JSON.parse(content);
      } catch {
        lastError = "LLM returned invalid JSON";
        continue;
      }
    }

    const result = schema.safeParse(parsedJson);
    if (!result.success) {
      lastError = "LLM output failed schema validation";
      continue;
    }

    const raw = typeof content === "string" ? content : JSON.stringify(content);
    return {
      data: result.data,
      tokensIn: out.usage?.prompt_tokens ?? Math.ceil((system.length + user.length) / 4),
      tokensOut: out.usage?.completion_tokens ?? Math.ceil(raw.length / 4),
    };
  }

  throw new LlmError(lastError);
}

// ── Public entrypoints ────────────────────────────────────────────────────────

export function runMatch(env: Env, jobDescription: string, cvText: string) {
  return runStructured(
    env,
    "match",
    MATCH_PROMPT,
    `JOB DESCRIPTION:\n${jobDescription}\n\nCANDIDATE CV:\n${cvText}`,
    MatchAnalysisSchema
  );
}

export function runTailor(
  env: Env,
  jobDescription: string,
  cvText: string,
  gaps: string[]
) {
  return runStructured(
    env,
    "tailor",
    TAILOR_PROMPT,
    `JOB DESCRIPTION:\n${jobDescription}\n\nCANDIDATE CV:\n${cvText}\n\nGAPS FOUND:\n${gaps
      .map((g) => `- ${g}`)
      .join("\n")}`,
    TailoredCvSchema
  );
}

export class LlmError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmError";
  }
}
