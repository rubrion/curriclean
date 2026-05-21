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

export function scoreShade(score: number): string {
	if (score >= 90) return "text-white";
	if (score >= 75) return "text-[#fafafa]";
	if (score >= 60) return "text-[#cbd5e1]";
	if (score >= 40) return "text-[#94a3b8]";
	return "text-[#64748b]";
}
