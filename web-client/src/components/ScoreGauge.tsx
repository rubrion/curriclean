import { scoreTier } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Radial score gauge (0–100), colored by fit tier. */
export function ScoreGauge({
	score,
	size = 140,
	className,
	showLabel = true,
}: {
	score: number;
	size?: number;
	className?: string;
	showLabel?: boolean;
}) {
	const tier = scoreTier(score);
	const stroke = Math.max(6, Math.round(size / 13));
	const r = (size - stroke) / 2;
	const circumference = 2 * Math.PI * r;
	const offset = circumference * (1 - Math.min(100, Math.max(0, score)) / 100);

	return (
		<div className={cn("inline-flex flex-col items-center gap-2", className)}>
			<div className="relative" style={{ width: size, height: size }}>
				<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
					<circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tier.soft} strokeWidth={stroke} />
					<circle
						cx={size / 2}
						cy={size / 2}
						r={r}
						fill="none"
						stroke={tier.color}
						strokeWidth={stroke}
						strokeLinecap="round"
						strokeDasharray={circumference}
						strokeDashoffset={offset}
						className="transition-[stroke-dashoffset] duration-700 ease-out"
					/>
				</svg>
				<div className="absolute inset-0 flex flex-col items-center justify-center">
					<span className="font-semibold tabular-nums tracking-tight" style={{ fontSize: size * 0.3 }}>
						{score}
					</span>
					{size >= 100 && <span className="text-xs text-muted-foreground">out of 100</span>}
				</div>
			</div>
			{showLabel && (
				<span
					className="rounded-full px-2.5 py-0.5 text-xs font-medium"
					style={{ color: tier.color, backgroundColor: tier.soft }}
				>
					{tier.label}
				</span>
			)}
		</div>
	);
}

/** Small inline score pill for lists and cards. */
export function ScorePill({ score, className }: { score: number; className?: string }) {
	const tier = scoreTier(score);
	return (
		<span
			className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums", className)}
			style={{ color: tier.color, backgroundColor: tier.soft }}
			title={tier.label}
		>
			{score}%
		</span>
	);
}
