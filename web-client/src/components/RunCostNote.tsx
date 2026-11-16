"use client";

import { SparklesIcon } from "lucide-react";

import { useBilling } from "@/lib/billing";

/** "2 credits · from your free daily credit" next to an AI action. */
export function RunCostNote({ action }: { action: "analysis" | "tailor" }) {
	const { billing } = useBilling();
	if (!billing) return null;
	const price = billing.prices[action];
	const free = Math.min(price, billing.daily_credit_left);
	const paid = price - free;
	const cost = `${price} credit${price === 1 ? "" : "s"}`;
	const source =
		paid === 0
			? "from your free daily credit"
			: free > 0
				? `${free} free + ${paid} from your balance (${billing.credits} left)`
				: `from your balance (${billing.credits} left)`;
	return (
		<span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
			<SparklesIcon className="size-3 text-primary" />
			{cost} · {source}
		</span>
	);
}
