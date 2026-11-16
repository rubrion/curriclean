"use client";

import { SparklesIcon } from "lucide-react";

import { useI18n } from "@/i18n/client";
import { useBilling } from "@/lib/billing";

/** "2 credits · from your free daily credit" next to an AI action. */
export function RunCostNote({ action }: { action: "analysis" | "tailor" }) {
	const { billing } = useBilling();
	const { t } = useI18n();
	if (!billing) return null;
	const price = billing.prices[action];
	const cost = t(price === 1 ? "cost.credits.one" : "cost.credits.other", { n: price });
	let source: string;
	if (billing.unlimited) source = t("cost.unlimited");
	else {
		const free = Math.min(price, billing.daily_credit_left);
		const paid = price - free;
		source =
			paid === 0
				? t("cost.fromFree")
				: free > 0
					? t("cost.split", { free, paid, left: billing.credits })
					: t("cost.fromBalance", { left: billing.credits });
	}
	return (
		<span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
			<SparklesIcon className="size-3 text-primary" />
			{cost} · {source}
		</span>
	);
}
