"use client";

import { useState } from "react";

import { api, ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { ProfileHit } from "@/lib/types";
import { useBearer } from "@/lib/useBearer";

export function SuggestedProfilesPanel({
	applicationId,
	initialHits,
	initialUpdatedAt,
}: {
	applicationId: string;
	initialHits: ProfileHit[] | null;
	initialUpdatedAt: string | null;
}) {
	const bearer = useBearer();
	const [hits, setHits] = useState<ProfileHit[] | null>(initialHits);
	const [updatedAt, setUpdatedAt] = useState<string | null>(initialUpdatedAt);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [notConfigured, setNotConfigured] = useState(false);

	const hasData = hits !== null && hits.length > 0;

	async function fetchHits() {
		if (!bearer) {
			setError("Not signed in.");
			return;
		}
		setError(null);
		setNotConfigured(false);
		setLoading(true);
		try {
			const res = await api.getSuggestedProfiles(bearer, applicationId, {
				refresh: hasData,
			});
			setHits(res.hits);
			setUpdatedAt(new Date().toISOString());
		} catch (e: unknown) {
			if (e instanceof ApiError) {
				if (e.status === 503) {
					if (!hasData) setNotConfigured(true);
					else setError("LinkedIn search not configured. Showing previous results.");
				} else {
					const msg = typeof e.detail === "string" ? e.detail : e.message;
					setError(hasData ? `${msg}. Showing previous results.` : msg);
				}
			} else {
				setError(hasData ? "Network error. Showing previous results." : "Network error.");
			}
		} finally {
			setLoading(false);
		}
	}

	return (
		<section className="flex flex-col gap-3">
			<div className="flex items-start justify-between gap-4">
				<div className="flex flex-col">
					<h2 className="text-lg font-semibold tracking-tight">Suggested profiles</h2>
					<p className="font-mono text-xs text-[#64748b]">
						LinkedIn profiles relevant to this role, via Brave Search.
					</p>
				</div>
				<div className="flex flex-col items-end gap-1">
					<button
						type="button"
						onClick={fetchHits}
						disabled={loading}
						className="border border-[#fafafa]/60 px-3 py-1.5 font-mono text-xs uppercase tracking-wider hover:border-[#fafafa] disabled:opacity-40"
					>
						{loading ? "Searching…" : hasData ? "Refresh" : "Find profiles"}
					</button>
					{updatedAt && (
						<span className="font-mono text-xs text-[#64748b]">
							updated {formatDateTime(updatedAt)}
						</span>
					)}
				</div>
			</div>

			{notConfigured && (
				<div className="font-mono text-xs text-[#64748b]">
					LinkedIn search not configured.
				</div>
			)}

			{error && !notConfigured && (
				<div className="border border-[#fafafa] p-3 font-mono text-sm">{error}</div>
			)}

			{hits !== null && hits.length === 0 && !error && !notConfigured && (
				<div className="font-mono text-xs text-[#64748b]">No profiles found.</div>
			)}

			{hits && hits.length > 0 && (
				<ul className="flex flex-col divide-y divide-[#fafafa]/20 border border-[#fafafa]/40">
					{hits.map((h) => (
						<li key={h.url}>
							<a
								href={h.url}
								target="_blank"
								rel="noopener noreferrer"
								className="flex flex-col gap-1 p-4 hover:bg-[#fafafa]/5"
							>
								<div className="truncate text-sm font-medium">{h.title}</div>
								{h.description && (
									<div className="line-clamp-2 text-xs text-[#fafafa]/80">
										{h.description}
									</div>
								)}
								<div className="truncate font-mono text-xs text-[#64748b]">
									{h.url}
								</div>
							</a>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
