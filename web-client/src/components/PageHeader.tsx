import { cn } from "@/lib/utils";

export function PageHeader({
	title,
	description,
	actions,
	className,
}: {
	title: React.ReactNode;
	description?: React.ReactNode;
	actions?: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("flex flex-wrap items-end justify-between gap-4 pb-6", className)}>
			<div className="flex min-w-0 flex-col gap-1">
				<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
				{description && <p className="text-sm text-muted-foreground">{description}</p>}
			</div>
			{actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
		</div>
	);
}
