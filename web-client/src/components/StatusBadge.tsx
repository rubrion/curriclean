import { STATUS_META } from "@/lib/format";
import type { ApplicationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: ApplicationStatus; className?: string }) {
	const meta = STATUS_META[status];
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
				meta.className,
				className,
			)}
		>
			<span className={cn("size-1.5 rounded-full", meta.dot)} />
			{meta.label}
		</span>
	);
}
