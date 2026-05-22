"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

import { MatchPanel } from "@/components/MatchPanel";
import { StatusBadge } from "@/components/StatusBadge";
import { SuggestedProfilesPanel } from "@/components/SuggestedProfilesPanel";
import { api, ApiError } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/format";
import {
	APPLICATION_STATUSES,
	type Application,
	type ApplicationStatus,
	type MatchResponse,
} from "@/lib/types";
import { useBearer } from "@/lib/useBearer";

export default function ApplicationDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	const bearer = useBearer();
	const [app, setApp] = useState<Application | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!bearer) return;
		let cancelled = false;
		setLoading(true);
		setError(null);
		api
			.getApplication(bearer, id)
			.then((a) => {
				if (!cancelled) setApp(a);
			})
			.catch((e: unknown) => {
				if (cancelled) return;
				const msg = e instanceof ApiError ? e.message : "Failed to load application.";
				setError(msg);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [id, bearer]);

	async function changeStatus(s: ApplicationStatus) {
		if (!app || !bearer) return;
		try {
			const updated = await api.updateApplication(bearer, app.id, { status: s });
			setApp(updated);
		} catch (e: unknown) {
			setError(e instanceof ApiError ? e.message : "Failed to update status.");
		}
	}

	function onMatchResult(r: MatchResponse) {
		setApp((prev) =>
			prev
				? {
						...prev,
						analysis: { analysis: r.analysis, metrics: r.metrics },
						analysis_hash: r.metrics.cache_key,
						analysis_updated_at: r.updated_at,
					}
				: prev,
		);
	}

	if (loading) return <div className="font-mono text-sm text-[#64748b]">Loading…</div>;
	if (error)
		return (
			<div className="flex flex-col gap-4">
				<div className="border border-[#fafafa] p-4 font-mono text-sm">{error}</div>
				<Link href="/applications" className="font-mono text-xs underline">
					← Back
				</Link>
			</div>
		);
	if (!app) return null;

	const initialResult: MatchResponse | null = app.analysis
		? {
				application_id: app.id,
				analysis: app.analysis.analysis,
				metrics: { ...app.analysis.metrics, cached: true },
				updated_at: app.analysis_updated_at ?? app.updated_at,
			}
		: null;

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-3">
				<Link href="/applications" className="font-mono text-xs text-[#64748b] hover:underline">
					← Applications
				</Link>
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div className="flex flex-col gap-1">
						<h1 className="text-2xl font-semibold tracking-tight">{app.title}</h1>
						<div className="font-mono text-sm text-[#64748b]">
							{app.company} • applied {formatDate(app.applied_at)}
						</div>
					</div>
					<div className="flex items-center gap-2">
						<StatusBadge status={app.status} />
					</div>
				</div>
			</div>

			<section className="flex flex-col gap-2">
				<div className="font-mono text-xs uppercase tracking-wider text-[#64748b]">Status</div>
				<div className="flex flex-wrap gap-2">
					{APPLICATION_STATUSES.map((s) => (
						<button
							key={s}
							type="button"
							onClick={() => changeStatus(s)}
							className={`border px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors ${
								app.status === s
									? "border-[#fafafa] bg-[#fafafa] text-[#09090b]"
									: "border-[#fafafa]/40 hover:border-[#fafafa]"
							}`}
						>
							{s}
						</button>
					))}
				</div>
				<div className="font-mono text-xs text-[#64748b]">
					updated {formatDateTime(app.updated_at)}
				</div>
			</section>

			<section className="flex flex-col gap-2">
				<div className="font-mono text-xs uppercase tracking-wider text-[#64748b]">
					Job description
				</div>
				<pre className="max-h-80 overflow-auto whitespace-pre-wrap border border-[#fafafa]/40 p-4 font-mono text-xs leading-relaxed">
					{app.description}
				</pre>
			</section>

			<SuggestedProfilesPanel applicationId={app.id} />

			<MatchPanel application={app} initialResult={initialResult} onResult={onMatchResult} />
		</div>
	);
}
