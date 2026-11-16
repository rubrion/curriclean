"use client";

import { ArrowRightIcon, CheckIcon, CopyIcon, RefreshCwIcon, WandSparklesIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ErrorAlert } from "@/components/ErrorAlert";
import { RunCostNote } from "@/components/RunCostNote";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/i18n/client";
import { api } from "@/lib/api";
import { useBilling } from "@/lib/billing";
import { type FriendlyError, toFriendlyError } from "@/lib/errors";
import { formatRelative } from "@/lib/format";
import type { Application, TailoredCv, TailorResponse } from "@/lib/types";
import { useBearer } from "@/lib/useBearer";

export function TailorPanel({
	application,
	cvText,
	onResult,
}: {
	application: Application;
	cvText: string;
	onResult: (r: TailorResponse) => void;
}) {
	const bearer = useBearer();
	const { refresh } = useBilling();
	const { t, locale } = useI18n();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<FriendlyError | null>(null);
	const [lastForce, setLastForce] = useState(false);

	const tailored = application.tailored;
	const hasAnalysis = Boolean(application.analysis);
	const canRun = hasAnalysis && cvText.trim().length >= 50 && !loading;

	async function run(force = false) {
		if (!bearer) return;
		setError(null);
		setLoading(true);
		setLastForce(force);
		try {
			onResult(await api.tailorCv(bearer, application.id, cvText, locale, force));
			toast.success(t("tailor.ready"));
		} catch (e) {
			setError(toFriendlyError(e));
		} finally {
			setLoading(false);
			void refresh();
		}
	}

	return (
		<div className="flex flex-col gap-4">
			<Card>
				<CardContent className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex flex-col gap-0.5">
						<span className="font-medium">{t("tailor.prompt")}</span>
						{!hasAnalysis ? (
							<span className="text-xs text-muted-foreground">{t("tailor.needMatch")}</span>
						) : cvText.trim().length < 50 ? (
							<span className="text-xs text-muted-foreground">{t("match.addCv")}</span>
						) : (
							<RunCostNote action="tailor" />
						)}
					</div>
					<div className="flex gap-2">
						{tailored && (
							<Button variant="outline" disabled={!canRun} onClick={() => run(true)}>
								<RefreshCwIcon />
								{t("tailor.regenerate")}
							</Button>
						)}
						<Button disabled={!canRun} onClick={() => run(false)}>
							{loading ? <Spinner /> : <WandSparklesIcon />}
							{loading ? t("tailor.writing") : tailored ? t("tailor.again") : t("tailor.submit")}
						</Button>
					</div>
				</CardContent>
			</Card>

			{error && <ErrorAlert error={error} onRetry={() => run(lastForce)} />}

			{loading && !tailored ? (
				<div className="flex flex-col gap-4">
					<Skeleton className="h-32" />
					<Skeleton className="h-64" />
				</div>
			) : tailored ? (
				<TailoredView tailored={tailored} updatedAt={application.tailored_updated_at} dimmed={loading} />
			) : (
				<Card>
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<WandSparklesIcon />
							</EmptyMedia>
							<EmptyTitle>{t("tailor.emptyTitle")}</EmptyTitle>
							<EmptyDescription>{t("tailor.emptyDesc")}</EmptyDescription>
						</EmptyHeader>
					</Empty>
				</Card>
			)}
		</div>
	);
}

function TailoredView({
	tailored,
	updatedAt,
	dimmed,
}: {
	tailored: TailoredCv;
	updatedAt: string | null;
	dimmed: boolean;
}) {
	const { t, intl } = useI18n();
	return (
		<div className={`flex flex-col gap-4 transition-opacity ${dimmed ? "opacity-50" : ""}`}>
			<Card>
				<CardHeader>
					<CardDescription>{t("tailor.headline")}</CardDescription>
					<CardTitle className="text-lg leading-snug">{tailored.headline}</CardTitle>
					<CardAction>
						<CopyButton text={`${tailored.headline}\n\n${tailored.summary}`} />
					</CardAction>
				</CardHeader>
				<CardContent className="flex flex-col gap-3">
					<p className="leading-relaxed text-foreground/85">{tailored.summary}</p>
					{updatedAt && (
						<span className="text-xs text-muted-foreground">
							{t("tailor.generated", { when: formatRelative(updatedAt, t, intl) })}
						</span>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t("tailor.bullets")}</CardTitle>
					<CardDescription>{t("tailor.bulletsDesc")}</CardDescription>
					<CardAction>
						<CopyButton text={tailored.bullets.map((b) => `• ${b.improved}`).join("\n")} />
					</CardAction>
				</CardHeader>
				<CardContent className="flex flex-col gap-3">
					{tailored.bullets.map((b, i) => (
						<div key={i} className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-3 text-sm">
							{b.original && (
								<div className="flex gap-2 text-muted-foreground line-through decoration-muted-foreground/40">
									{b.original}
								</div>
							)}
							<div className="flex gap-2 font-medium">
								{b.original && <ArrowRightIcon className="mt-0.5 size-4 shrink-0 text-primary" />}
								<span>{b.improved}</span>
							</div>
							<div className="text-xs text-muted-foreground">{b.reason}</div>
						</div>
					))}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t("tailor.keywords")}</CardTitle>
					<CardDescription>{t("tailor.keywordsDesc")}</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-wrap gap-2">
					{tailored.keywords.map((k) => (
						<Badge key={k} variant="secondary" className="rounded-full px-3 py-1 text-sm">
							{k}
						</Badge>
					))}
				</CardContent>
			</Card>
		</div>
	);
}

function CopyButton({ text }: { text: string }) {
	const { t } = useI18n();
	const [copied, setCopied] = useState(false);
	return (
		<Button
			variant="ghost"
			size="sm"
			onClick={async () => {
				try {
					await navigator.clipboard.writeText(text);
					setCopied(true);
					setTimeout(() => setCopied(false), 1500);
				} catch {
					toast.error(t("tailor.copyFailed"));
				}
			}}
		>
			{copied ? <CheckIcon /> : <CopyIcon />}
			{copied ? t("tailor.copied") : t("tailor.copy")}
		</Button>
	);
}
