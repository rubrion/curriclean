import type { ApplicationStatus } from "./types";

export function formatDate(iso: string): string {
	const d = new Date(iso);
	return d.toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "2-digit",
	});
}

export function formatDateTime(iso: string): string {
	const d = new Date(iso);
	return d.toLocaleString(undefined, {
		year: "numeric",
		month: "short",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function formatRelative(iso: string): string {
	const diff = Date.now() - new Date(iso).getTime();
	const mins = Math.round(diff / 60_000);
	if (mins < 1) return "just now";
	if (mins < 60) return `${mins} min ago`;
	const hours = Math.round(mins / 60);
	if (hours < 24) return `${hours} h ago`;
	const days = Math.round(hours / 24);
	if (days < 7) return `${days} d ago`;
	return formatDate(iso);
}

export type ScoreTier = { label: string; color: string; soft: string };

/** Score tiers: sage for strong, amber for moderate, terracotta for weak. */
export function scoreTier(score: number): ScoreTier {
	if (score >= 85) return { label: "Excellent fit", color: "var(--success)", soft: "var(--success-soft)" };
	if (score >= 70) return { label: "Strong fit", color: "var(--success)", soft: "var(--success-soft)" };
	if (score >= 50) return { label: "Moderate fit", color: "var(--warning)", soft: "var(--warning-soft)" };
	if (score >= 30) return { label: "Weak fit", color: "var(--danger)", soft: "var(--danger-soft)" };
	return { label: "Poor fit", color: "var(--danger)", soft: "var(--danger-soft)" };
}

export const STATUS_META: Record<
	ApplicationStatus,
	{ label: string; className: string; dot: string }
> = {
	saved: { label: "Saved", className: "bg-secondary text-secondary-foreground", dot: "bg-muted-foreground" },
	applied: { label: "Applied", className: "bg-info-soft text-info", dot: "bg-info" },
	interviewing: { label: "Interviewing", className: "bg-warning-soft text-warning", dot: "bg-warning" },
	offer: { label: "Offer", className: "bg-success-soft text-success", dot: "bg-success" },
	rejected: { label: "Rejected", className: "bg-danger-soft text-danger", dot: "bg-danger" },
	withdrawn: { label: "Withdrawn", className: "bg-muted text-muted-foreground", dot: "bg-muted-foreground/60" },
};
