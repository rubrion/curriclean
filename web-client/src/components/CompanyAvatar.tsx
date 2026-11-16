import { cn } from "@/lib/utils";

export function CompanyAvatar({ name, className }: { name: string; className?: string }) {
	const letter = name.trim()[0]?.toUpperCase() ?? "?";
	const palette = ["bg-accent text-accent-foreground", "bg-success-soft text-success", "bg-info-soft text-info", "bg-warning-soft text-warning"];
	const tone = palette[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length];
	return (
		<span
			className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold", tone, className)}
		>
			{letter}
		</span>
	);
}
