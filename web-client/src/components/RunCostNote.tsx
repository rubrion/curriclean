"use client";

import { SparklesIcon } from "lucide-react";

import { useBilling } from "@/lib/billing";

/** "Uses 1 of your 3 free runs today" / "Costs 2 credits" next to an AI action. */
export function RunCostNote({ action }: { action: "analysis" | "tailor" }) {
	const { billing } = useBilling();
	if (!billing) return null;
	const price = billing.prices[action];
	const text =
		billing.free_runs_left > 0
			? `Uses 1 of ${billing.free_runs_left} free run${billing.free_runs_left === 1 ? "" : "s"} left today`
			: `Costs ${price} credit${price === 1 ? "" : "s"} · ${billing.credits} available`;
	return (
		<span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
			<SparklesIcon className="size-3 text-primary" />
			{text}
		</span>
	);
}
