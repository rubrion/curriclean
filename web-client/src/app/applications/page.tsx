"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { StatusBadge } from "@/components/StatusBadge";
import { api, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { APPLICATION_STATUSES, type Application, type ApplicationStatus } from "@/lib/types";

export default function ApplicationsPage() {
	const [items, setItems] = useState<Application[] | null>(null);
	const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError(null);
		const status = statusFilter === "all" ? undefined : statusFilter;
		api
			.listApplications(status)
			.then((rows) => {
				if (!cancelled) setItems(rows);
			})
			.catch((e: unknown) => {
				if (cancelled) return;
				const msg = e instanceof ApiError ? `${e.message}` : "Failed to load applications.";
				setError(msg);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [statusFilter]);

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-end justify-between">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
					<p className="font-mono text-xs text-[#64748b]">
						{items?.length ?? 0} record{items?.length === 1 ? "" : "s"}
					</p>
				</div>
			</div>

			<div className="flex flex-wrap gap-2">
				<FilterChip
					label="all"
					active={statusFilter === "all"}
					onClick={() => setStatusFilter("all")}
				/>
				{APPLICATION_STATUSES.map((s) => (
					<FilterChip
						key={s}
						label={s}
						active={statusFilter === s}
						onClick={() => setStatusFilter(s)}
					/>
				))}
			</div>

			{loading && (
				<div className="font-mono text-sm text-[#64748b]">Loading…</div>
			)}
			{error && !loading && (
				<div className="border border-[#fafafa] p-4 font-mono text-sm">{error}</div>
			)}
			{!loading && !error && items && items.length === 0 && (
				<div className="border border-dashed border-[#fafafa]/40 p-8 text-center font-mono text-sm text-[#64748b]">
					No applications.{" "}
					<Link href="/applications/new" className="underline">
						Create one
					</Link>
					.
				</div>
			)}
			{!loading && !error && items && items.length > 0 && (
				<ul className="divide-y divide-[#fafafa]/20 border border-[#fafafa]/40">
					{items.map((a) => (
						<li key={a.id}>
							<Link
								href={`/applications/${a.id}`}
								className="flex items-center justify-between gap-4 p-4 hover:bg-[#fafafa]/5"
							>
								<div className="flex min-w-0 flex-col gap-1">
									<div className="truncate text-base font-medium">{a.title}</div>
									<div className="truncate font-mono text-xs text-[#64748b]">
										{a.company} • {formatDate(a.applied_at)}
									</div>
								</div>
								<div className="flex shrink-0 items-center gap-3">
									{a.analysis && (
										<span className="font-mono text-xs text-[#fafafa]">
											{a.analysis.analysis.score}%
										</span>
									)}
									<StatusBadge status={a.status} />
								</div>
							</Link>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

function FilterChip({
	label,
	active,
	onClick,
}: {
	label: string;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`border px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors ${
				active
					? "border-[#fafafa] bg-[#fafafa] text-[#09090b]"
					: "border-[#fafafa]/40 text-[#fafafa] hover:border-[#fafafa]"
			}`}
		>
			{label}
		</button>
	);
}
