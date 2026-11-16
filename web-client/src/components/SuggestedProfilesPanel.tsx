"use client";

import { ExternalLinkIcon, RefreshCwIcon, SearchIcon, UsersIcon } from "lucide-react";
import { useState } from "react";

import { ErrorAlert } from "@/components/ErrorAlert";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api";
import { type FriendlyError, toFriendlyError } from "@/lib/errors";
import { formatRelative } from "@/lib/format";
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
	const [error, setError] = useState<FriendlyError | null>(null);

	const hasData = hits !== null && hits.length > 0;

	async function fetchHits() {
		if (!bearer) return;
		setError(null);
		setLoading(true);
		try {
			const res = await api.getSuggestedProfiles(bearer, applicationId, { refresh: hasData });
			setHits(res.hits);
			setUpdatedAt(new Date().toISOString());
		} catch (e) {
			setError(toFriendlyError(e));
		} finally {
			setLoading(false);
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>People in similar roles</CardTitle>
				<CardDescription>
					LinkedIn profiles related to this position — great for networking or referrals.
					{updatedAt && ` Updated ${formatRelative(updatedAt)}.`}
				</CardDescription>
				<CardAction>
					<Button variant={hasData ? "outline" : "default"} size="sm" onClick={fetchHits} disabled={loading}>
						{loading ? <Spinner /> : hasData ? <RefreshCwIcon /> : <SearchIcon />}
						{loading ? "Searching…" : hasData ? "Refresh" : "Find people"}
					</Button>
				</CardAction>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				{error && <ErrorAlert error={error} onRetry={fetchHits} />}

				{loading && !hasData &&
					Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}

				{!loading && hits === null && !error && (
					<Empty className="py-6">
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<UsersIcon />
							</EmptyMedia>
							<EmptyTitle>Find people to talk to</EmptyTitle>
							<EmptyDescription>We&apos;ll search for professionals connected to this role and company.</EmptyDescription>
						</EmptyHeader>
					</Empty>
				)}

				{hits !== null && hits.length === 0 && !error && (
					<p className="py-6 text-center text-sm text-muted-foreground">No profiles found for this role yet.</p>
				)}

				{hasData && (
					<ul className="flex flex-col divide-y rounded-lg border">
						{hits.map((h) => (
							<li key={h.url}>
								<a
									href={h.url}
									target="_blank"
									rel="noopener noreferrer"
									className="group flex items-start gap-3 p-3 transition-colors hover:bg-muted/40"
								>
									<span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-info-soft text-sm font-semibold text-info">
										{h.title.trim()[0]?.toUpperCase() ?? "?"}
									</span>
									<div className="min-w-0 flex-1">
										<div className="truncate text-sm font-medium">{h.title}</div>
										{h.description && (
											<div className="line-clamp-2 text-xs text-muted-foreground">{h.description}</div>
										)}
									</div>
									<ExternalLinkIcon className="mt-1 size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
								</a>
							</li>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}
