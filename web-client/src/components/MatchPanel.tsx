"use client";

import { useRef, useState } from "react";

import { api, ApiError } from "@/lib/api";
import { scoreShade } from "@/lib/format";
import type { Application, MatchResponse } from "@/lib/types";
import { useBearer } from "@/lib/useBearer";

export function MatchPanel({
	application,
	initialResult,
	onResult,
}: {
	application: Application;
	initialResult: MatchResponse | null;
	onResult: (r: MatchResponse) => void;
}) {
	const bearer = useBearer();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [cvText, setCvText] = useState("");
	const [result, setResult] = useState<MatchResponse | null>(initialResult);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<{ message: string; retryable: boolean } | null>(null);
	const [uploading, setUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);

	async function onPdfChosen(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file) return;
		if (!bearer) {
			setUploadError("Not signed in.");
			return;
		}
		setUploadError(null);
		setUploading(true);
		try {
			const res = await api.parseCvPdf(bearer, file);
			setCvText(res.text);
		} catch (e: unknown) {
			if (e instanceof ApiError) {
				setUploadError(stringifyDetail(e));
			} else {
				setUploadError("Network error.");
			}
		} finally {
			setUploading(false);
		}
	}

	async function run(force = false) {
		setError(null);
		setLoading(true);
		try {
			if (!bearer) {
				setError({ message: "Not signed in.", retryable: false });
				setLoading(false);
				return;
			}
			const r = await api.runMatch(bearer, application.id, cvText, force);
			setResult(r);
			onResult(r);
		} catch (e: unknown) {
			if (e instanceof ApiError) {
				setError({ message: stringifyDetail(e), retryable: !e.isClientError });
			} else {
				setError({ message: "Network error.", retryable: true });
			}
		} finally {
			setLoading(false);
		}
	}

	const canSubmit = cvText.trim().length > 0 && !loading;

	return (
		<section className="flex flex-col gap-6">
			<div className="flex flex-col gap-2">
				<h2 className="text-lg font-semibold tracking-tight">Match analysis</h2>
				<p className="font-mono text-xs text-[#64748b]">
					Paste your CV text or upload a PDF. Hashed against job description for idempotent caching.
				</p>
			</div>

			<div className="flex flex-wrap items-center gap-3">
				<input
					ref={fileInputRef}
					type="file"
					accept="application/pdf"
					onChange={onPdfChosen}
					className="hidden"
				/>
				<button
					type="button"
					onClick={() => fileInputRef.current?.click()}
					disabled={uploading}
					className="border border-[#fafafa]/60 px-3 py-1.5 font-mono text-xs uppercase tracking-wider hover:border-[#fafafa] disabled:opacity-40"
				>
					{uploading ? "Parsing PDF…" : "Upload PDF"}
				</button>
				{uploadError && (
					<span className="font-mono text-xs text-[#fafafa]">{uploadError}</span>
				)}
			</div>

			<textarea
				value={cvText}
				onChange={(e) => setCvText(e.target.value)}
				placeholder="Paste CV text here…"
				rows={10}
				className="w-full border border-[#fafafa]/60 bg-transparent px-3 py-2 font-mono text-sm outline-none focus:border-[#fafafa]"
			/>

			<div className="flex flex-wrap gap-3">
				<button
					type="button"
					disabled={!canSubmit}
					onClick={() => run(false)}
					className="border border-[#fafafa] bg-[#fafafa] px-4 py-2 text-[#09090b] disabled:opacity-40"
				>
					{loading ? "Analyzing…" : "Analyze"}
				</button>
				<button
					type="button"
					disabled={!canSubmit}
					onClick={() => run(true)}
					className="border border-[#fafafa]/60 px-4 py-2 hover:border-[#fafafa] disabled:opacity-40"
					title="Bypass cache"
				>
					Force regenerate
				</button>
			</div>

			{error && (
				<div className="flex items-center justify-between gap-4 border border-[#fafafa] p-4">
					<div className="font-mono text-sm">{error.message}</div>
					{error.retryable && (
						<button
							type="button"
							onClick={() => run(false)}
							className="border border-[#fafafa] px-3 py-1 font-mono text-xs uppercase tracking-wider hover:bg-[#fafafa] hover:text-[#09090b]"
						>
							Retry
						</button>
					)}
				</div>
			)}

			{result && <MatchResult result={result} />}
		</section>
	);
}

function stringifyDetail(e: ApiError): string {
	if (typeof e.detail === "string") return e.detail;
	if (e.detail && typeof e.detail === "object") {
		try {
			return JSON.stringify(e.detail);
		} catch {
			return e.message;
		}
	}
	return e.message;
}

function MatchResult({ result }: { result: MatchResponse }) {
	const { analysis, metrics } = result;
	return (
		<div className="flex flex-col gap-6 border border-[#fafafa]/40 p-6">
			<div className="flex items-end justify-between gap-4">
				<div>
					<div className="font-mono text-xs uppercase tracking-wider text-[#64748b]">
						Match score
					</div>
					<div className={`text-6xl font-semibold tracking-tight ${scoreShade(analysis.score)}`}>
						{analysis.score}
						<span className="text-2xl text-[#64748b]">/100</span>
					</div>
				</div>
				<div className="flex flex-col gap-1 text-right font-mono text-xs text-[#64748b]">
					<span>{metrics.cached ? "cache hit" : "fresh"}</span>
					<span>{metrics.model}</span>
				</div>
			</div>

			<p className="text-base leading-relaxed">{analysis.summary}</p>

			<Section title="Strengths" items={analysis.strengths} />
			<Section title="Gaps" items={analysis.gaps} />
			<Section title="Interview questions" items={analysis.interview_questions} numbered />

			<MetricsBlock metrics={metrics} />
		</div>
	);
}

function Section({
	title,
	items,
	numbered = false,
}: {
	title: string;
	items: string[];
	numbered?: boolean;
}) {
	return (
		<div className="flex flex-col gap-2">
			<div className="font-mono text-xs uppercase tracking-wider text-[#64748b]">{title}</div>
			<ul className={`flex flex-col gap-1.5 text-sm ${numbered ? "list-decimal" : "list-disc"} pl-5`}>
				{items.map((s, i) => (
					<li key={i}>{s}</li>
				))}
			</ul>
		</div>
	);
}

function MetricsBlock({ metrics }: { metrics: MatchResponse["metrics"] }) {
	const rows: [string, string][] = [
		["model", metrics.model],
		["tokens_in", metrics.tokens_in.toString()],
		["tokens_out", metrics.tokens_out.toString()],
		["latency_ms", metrics.latency_ms.toString()],
		["cost_usd", metrics.cost_estimate_usd.toFixed(6)],
		["cached", metrics.cached.toString()],
		["cache_key", metrics.cache_key],
	];
	return (
		<div className="border-t border-[#fafafa]/20 pt-4">
			<div className="mb-2 font-mono text-xs uppercase tracking-wider text-[#64748b]">Metrics</div>
			<dl className="grid grid-cols-1 gap-1 font-mono text-xs">
				{rows.map(([k, v]) => (
					<div key={k} className="flex gap-3">
						<dt className="w-32 shrink-0 text-[#64748b]">{k}</dt>
						<dd className="break-all">{v}</dd>
					</div>
				))}
			</dl>
		</div>
	);
}
