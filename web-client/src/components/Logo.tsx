import { cn } from "@/lib/utils";

/** The CurriClean mark (painted with the brand color through a mask) and wordmark. */
export function Logo({
	className,
	markClassName,
	withWordmark = true,
}: {
	className?: string;
	markClassName?: string;
	withWordmark?: boolean;
}) {
	return (
		<span className={cn("inline-flex items-center gap-2.5", className)}>
			<span aria-hidden className={cn("logo-mark block h-7 shrink-0", markClassName)} />
			{withWordmark && (
				<span className="text-lg font-semibold tracking-tight">
					Curri<span className="text-primary">Clean</span>
				</span>
			)}
			<span className="sr-only">CurriClean</span>
		</span>
	);
}
