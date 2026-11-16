import type { TKey } from "@/i18n/dictionaries";

import type { ApplicationStatus } from "./types";

type T = (key: TKey, vars?: Record<string, string | number>) => string;

export function formatDate(iso: string, intl?: string): string {
	return new Date(iso).toLocaleDateString(intl, { year: "numeric", month: "short", day: "2-digit" });
}

export function formatDateTime(iso: string, intl?: string): string {
	return new Date(iso).toLocaleString(intl, {
		year: "numeric",
		month: "short",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function formatRelative(iso: string, t: T, intl?: string): string {
	const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
	if (mins < 1) return t("time.justNow");
	if (mins < 60) return t("time.minAgo", { n: mins });
	const hours = Math.round(mins / 60);
	if (hours < 24) return t("time.hAgo", { n: hours });
	const days = Math.round(hours / 24);
	if (days < 7) return t("time.dAgo", { n: days });
	return formatDate(iso, intl);
}

export type ScoreTier = { label: TKey; color: string; soft: string };

/** Score tiers: sage for strong, amber for moderate, terracotta for weak. */
export function scoreTier(score: number): ScoreTier {
	if (score >= 85) return { label: "score.excellent", color: "var(--success)", soft: "var(--success-soft)" };
	if (score >= 70) return { label: "score.strong", color: "var(--success)", soft: "var(--success-soft)" };
	if (score >= 50) return { label: "score.moderate", color: "var(--warning)", soft: "var(--warning-soft)" };
	if (score >= 30) return { label: "score.weak", color: "var(--danger)", soft: "var(--danger-soft)" };
	return { label: "score.poor", color: "var(--danger)", soft: "var(--danger-soft)" };
}

export const STATUS_META: Record<ApplicationStatus, { label: TKey; className: string; dot: string }> = {
	saved: { label: "status.saved", className: "bg-secondary text-secondary-foreground", dot: "bg-muted-foreground" },
	applied: { label: "status.applied", className: "bg-info-soft text-info", dot: "bg-info" },
	interviewing: { label: "status.interviewing", className: "bg-warning-soft text-warning", dot: "bg-warning" },
	offer: { label: "status.offer", className: "bg-success-soft text-success", dot: "bg-success" },
	rejected: { label: "status.rejected", className: "bg-danger-soft text-danger", dot: "bg-danger" },
	withdrawn: { label: "status.withdrawn", className: "bg-muted text-muted-foreground", dot: "bg-muted-foreground/60" },
};
