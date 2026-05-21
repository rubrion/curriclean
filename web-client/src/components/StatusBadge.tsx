import type { ApplicationStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: ApplicationStatus }) {
	return (
		<span className="inline-block border border-[#fafafa]/60 px-2 py-0.5 font-mono text-xs uppercase tracking-wider">
			{status}
		</span>
	);
}
