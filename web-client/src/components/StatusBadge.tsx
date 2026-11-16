"use client";

import { useI18n } from "@/i18n/client";
import { STATUS_META } from "@/lib/format";
import type { ApplicationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: ApplicationStatus; className?: string }) {
	const { t } = useI18n();
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
			{t(meta.label)}
		</span>
	);
}
