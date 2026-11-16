"use client";

import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import {
	ArrowDownLeftIcon,
	ArrowUpRightIcon,
	CheckIcon,
	CoinsIcon,
	ReceiptIcon,
	SparklesIcon,
	Undo2Icon,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { ErrorAlert } from "@/components/ErrorAlert";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { useBilling } from "@/lib/billing";
import { type FriendlyError, toFriendlyError } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";
import type { CreditPack, LedgerEntry, PaymentStatus } from "@/lib/types";
import { useApiQuery } from "@/lib/useApiQuery";
import { useBearer } from "@/lib/useBearer";
import { cn } from "@/lib/utils";

/** Poll until the webhook has credited the payment (null if it takes longer than ~30 s). */
async function waitForCredit(bearer: string, ref: string): Promise<PaymentStatus | null> {
	for (let i = 0; i < 20; i++) {
		const p = await api.getPayment(bearer, ref);
		if (p.status === "paid") return p;
		await new Promise((r) => setTimeout(r, 1500));
	}
	return null;
}

// One Stripe.js instance per publishable key.
const stripeCache = new Map<string, Promise<Stripe | null>>();
function stripeFor(key: string) {
	let p = stripeCache.get(key);
	if (!p) {
		p = loadStripe(key);
		stripeCache.set(key, p);
	}
	return p;
}

export default function BillingPage() {
	return (
		<Suspense>
			<BillingInner />
		</Suspense>
	);
}

function BillingInner() {
	const bearer = useBearer();
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();
	const { billing, refresh } = useBilling();
	const { data: ledger, error: ledgerError, reload: loadLedger } = useApiQuery<LedgerEntry[]>("ledger", (b) =>
		api.getLedger(b),
	);
	const [checkout, setCheckout] = useState<{ pack: CreditPack; secret: string; ref: string } | null>(null);
	const [opening, setOpening] = useState<string | null>(null);
	const [checkoutError, setCheckoutError] = useState<FriendlyError | null>(null);
	// Returning from a bank redirect (/billing?paid=pay_…) starts in the confirming state.
	const [confirming, setConfirming] = useState(() => Boolean(params.get("paid")));
	const polled = useRef<string | null>(null);

	const stripePromise = billing?.publishable_key ? stripeFor(billing.publishable_key) : null;

	/** Wait for the webhook to credit a payment, then refresh balance and history. */
	const confirmPayment = useCallback(
		(ref: string) => {
			if (!bearer || polled.current === ref) return;
			polled.current = ref;
			void waitForCredit(bearer, ref)
				.then((p) => {
					if (p) {
						toast.success(`${p.credits} credits added`, { description: "Thanks for your purchase!" });
					} else {
						toast.info("Payment received", {
							description: "Your credits will appear in a moment. Refresh the page if they don't.",
						});
					}
				})
				.catch(() => toast.error("We couldn't confirm your payment yet. Refresh in a moment."))
				.finally(() => {
					setConfirming(false);
					refresh();
					loadLedger();
				});
		},
		[bearer, refresh, loadLedger],
	);

	// Coming back from a bank redirect: /billing?paid=pay_…
	const paidRef = params.get("paid");
	useEffect(() => {
		if (!paidRef || !bearer) return;
		router.replace(pathname);
		confirmPayment(paidRef);
	}, [paidRef, bearer, router, pathname, confirmPayment]);

	async function buy(pack: CreditPack) {
		if (!bearer) return;
		setCheckoutError(null);
		setOpening(pack.id);
		try {
			const { client_secret, ref } = await api.createCheckout(bearer, pack.id);
			setCheckout({ pack, secret: client_secret, ref });
		} catch (e) {
			setCheckoutError(toFriendlyError(e));
		} finally {
			setOpening(null);
		}
	}

	const bestValue = billing?.packs.reduce<CreditPack | null>(
		(best, p) => (!best || p.credits / p.usd > best.credits / best.usd ? p : best),
		null,
	);

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Credits & billing"
				description="Pay only for what you use. Credits never expire."
				className="pb-0"
			/>

			<div className="grid gap-4 md:grid-cols-3">
				<Card className="md:col-span-2">
					<CardHeader>
						<CardDescription>Credit balance</CardDescription>
						<CardTitle className="flex items-baseline gap-2 text-4xl tabular-nums">
							{billing ? billing.credits : <Skeleton className="h-10 w-20" />}
							<span className="text-base font-normal text-muted-foreground">credits</span>
							{confirming && (
								<Badge variant="secondary" className="ml-2 gap-1.5 self-center">
									<Spinner className="size-3" />
									Confirming payment
								</Badge>
							)}
						</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-3 text-sm sm:grid-cols-2">
						<PriceRow label="Match analysis" credits={billing?.prices.analysis} />
						<PriceRow label="Tailored CV" credits={billing?.prices.tailor} />
						<PriceRow label="Re-opening a saved result" free />
						<PriceRow label="People search" free />
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardDescription className="flex items-center gap-1.5">
							<SparklesIcon className="size-3.5 text-primary" />
							Free runs today
						</CardDescription>
						<CardTitle className="text-4xl tabular-nums">
							{billing ? (
								<>
									{billing.free_runs_left}
									<span className="text-base font-normal text-muted-foreground">
										{" "}
										/ {billing.free_runs_daily}
									</span>
								</>
							) : (
								<Skeleton className="h-10 w-20" />
							)}
						</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-2">
						<Progress value={billing ? (billing.free_runs_left / Math.max(1, billing.free_runs_daily)) * 100 : 0} />
						<span className="text-xs text-muted-foreground">
							Free runs are used before credits and reset daily at midnight UTC.
						</span>
					</CardContent>
				</Card>
			</div>

			<section className="flex flex-col gap-3">
				<div>
					<h2 className="text-lg font-semibold tracking-tight">Top up</h2>
					<p className="text-sm text-muted-foreground">One-time purchase, securely processed by Stripe.</p>
				</div>
				{checkoutError && <ErrorAlert error={checkoutError} />}
				{billing && !billing.checkout_enabled && (
					<ErrorAlert
						error={{
							title: "Payments coming soon",
							message: "Buying credits isn't enabled yet. Your free daily runs are still available.",
							retryable: false,
						}}
					/>
				)}
				<div className="grid gap-4 sm:grid-cols-3">
					{(billing?.packs ?? []).map((p) => {
						const featured = bestValue?.id === p.id;
						return (
							<Card
								key={p.id}
								className={cn("relative", featured && "ring-2 ring-primary/60 shadow-soft")}
							>
								{featured && (
									<Badge className="absolute top-3 right-3 rounded-full">Best value</Badge>
								)}
								<CardHeader>
									<CardDescription>{p.credits} credits</CardDescription>
									<CardTitle className="text-3xl tabular-nums">${p.usd}</CardTitle>
								</CardHeader>
								<CardContent className="flex flex-col gap-1.5 text-sm text-muted-foreground">
									<span className="flex items-center gap-2">
										<CheckIcon className="size-4 text-success" />
										{billing ? Math.floor(p.credits / billing.prices.analysis) : "—"} match analyses
									</span>
									<span className="flex items-center gap-2">
										<CheckIcon className="size-4 text-success" />
										or {billing ? Math.floor(p.credits / billing.prices.tailor) : "—"} tailored CVs
									</span>
									<span className="flex items-center gap-2">
										<CheckIcon className="size-4 text-success" />
										{((p.usd / p.credits) * 100).toFixed(1)}¢ per
										credit
									</span>
								</CardContent>
								<CardFooter className="pt-2">
									<Button
										className="w-full"
										variant={featured ? "default" : "outline"}
										disabled={!billing?.checkout_enabled || opening !== null}
										onClick={() => buy(p)}
									>
										{opening === p.id ? <Spinner /> : <CoinsIcon />}
										Buy {p.credits} credits
									</Button>
								</CardFooter>
							</Card>
						);
					})}
					{!billing &&
						Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-60 rounded-xl" />)}
				</div>
			</section>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<ReceiptIcon className="size-4 text-muted-foreground" />
						Activity
					</CardTitle>
					<CardDescription>Purchases, refunds and credits spent</CardDescription>
				</CardHeader>
				<CardContent className="px-0">
					{ledgerError && (
						<div className="px-4">
							<ErrorAlert error={ledgerError} onRetry={loadLedger} />
						</div>
					)}
					{!ledger && !ledgerError && (
						<div className="flex flex-col gap-2 px-4">
							{Array.from({ length: 3 }).map((_, i) => (
								<Skeleton key={i} className="h-10 w-full" />
							))}
						</div>
					)}
					{ledger && ledger.length === 0 && (
						<p className="px-4 py-6 text-center text-sm text-muted-foreground">
							No credit activity yet. Free runs don&apos;t show up here.
						</p>
					)}
					{ledger && ledger.length > 0 && (
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="pl-4">Description</TableHead>
									<TableHead className="hidden sm:table-cell">Date</TableHead>
									<TableHead className="pr-4 text-right">Credits</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{ledger.map((l) => (
									<TableRow key={l.ref}>
										<TableCell className="pl-4">
											<span className="flex items-center gap-2.5">
												<LedgerIcon kind={l.kind} />
												<span className="truncate">{l.note ?? KIND_LABEL[l.kind]}</span>
											</span>
										</TableCell>
										<TableCell className="hidden text-muted-foreground sm:table-cell">
											{formatDateTime(l.created_at)}
										</TableCell>
										<TableCell
											className={cn(
												"pr-4 text-right font-medium tabular-nums",
												l.credits > 0 ? "text-success" : "text-muted-foreground",
											)}
										>
											{l.credits > 0 ? `+${l.credits}` : l.credits}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			<Dialog open={checkout !== null} onOpenChange={(o) => !o && setCheckout(null)}>
				<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Buy {checkout?.pack.credits} credits</DialogTitle>
						<DialogDescription>${checkout?.pack.usd} one-time payment · receipt sent by email</DialogDescription>
					</DialogHeader>
					{checkout && stripePromise && (
						<div className="overflow-hidden rounded-lg">
							<EmbeddedCheckoutProvider
								key={checkout.secret}
								stripe={stripePromise}
								options={{
									clientSecret: checkout.secret,
									onComplete: () => {
										const ref = checkout.ref;
										setCheckout(null);
										setConfirming(true);
										confirmPayment(ref);
									},
								}}
							>
								<EmbeddedCheckout />
							</EmbeddedCheckoutProvider>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

const KIND_LABEL: Record<LedgerEntry["kind"], string> = {
	topup: "Credit pack",
	refund: "Refund",
	spend: "AI run",
};

function LedgerIcon({ kind }: { kind: LedgerEntry["kind"] }) {
	const Icon = kind === "topup" ? ArrowDownLeftIcon : kind === "refund" ? Undo2Icon : ArrowUpRightIcon;
	const tone =
		kind === "topup" ? "bg-success-soft text-success" : kind === "refund" ? "bg-danger-soft text-danger" : "bg-muted text-muted-foreground";
	return (
		<span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", tone)}>
			<Icon className="size-3.5" />
		</span>
	);
}

function PriceRow({ label, credits, free }: { label: string; credits?: number; free?: boolean }) {
	return (
		<div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
			<span>{label}</span>
			<span className="font-medium tabular-nums">
				{free ? (
					<span className="text-success">Free</span>
				) : credits !== undefined ? (
					`${credits} credit${credits === 1 ? "" : "s"}`
				) : (
					"—"
				)}
			</span>
		</div>
	);
}
