"use client";

import {
	CheckCircle2Icon,
	ChevronDownIcon,
	CircleAlertIcon,
	MessageCircleQuestionIcon,
	RefreshCwIcon,
	SparklesIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ErrorAlert } from "@/components/ErrorAlert";
import { RunCostNote } from "@/components/RunCostNote";
import { ScoreGauge } from "@/components/ScoreGauge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api";
import { useBilling } from "@/lib/billing";
import { type FriendlyError, toFriendlyError } from "@/lib/errors";
import { formatRelative } from "@/lib/format";
import type { Application, MatchAnalysis, MatchResponse } from "@/lib/types";
import { useBearer } from "@/lib/useBearer";

export function MatchPanel({
	application,
	cvText,
	onResult,
}: {
	application: Application;
	cvText: string;
	onResult: (r: MatchResponse) => void;
}) {
	const bearer = useBearer();
	const { refresh } = useBilling();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<FriendlyError | null>(null);
	const [lastForce, setLastForce] = useState(false);

	const analysis = application.analysis;
	const canRun = cvText.trim().length >= 50 && !loading;

	async function run(force = false) {
		if (!bearer) return;
		setError(null);
		setLoading(true);
		setLastForce(force);
		try {
			const r = await api.runMatch(bearer, application.id, cvText, force);
			onResult(r);
			toast.success("Match analysis ready");
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
						<span className="font-medium">
							{analysis ? "Updated your CV?" : "See how well you fit this role"}
						</span>
						{canRun || loading ? (
							<RunCostNote action="analysis" />
						) : (
							<span className="text-xs text-muted-foreground">Add your CV on the left to get started.</span>
						)}
					</div>
					<div className="flex items-center">
						<Button
							disabled={!canRun}
							onClick={() => run(false)}
							className={analysis ? "rounded-r-none" : undefined}
						>
							{loading ? <Spinner /> : <SparklesIcon />}
							{loading ? "Analyzing…" : analysis ? "Analyze again" : "Analyze match"}
						</Button>
						{analysis && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										disabled={!canRun}
										aria-label="More analysis options"
										className="rounded-l-none border-l border-primary-foreground/20 px-2"
									>
										<ChevronDownIcon />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-64">
									<DropdownMenuLabel className="font-normal text-muted-foreground">
										Same CV? You&apos;ll get your saved result for free.
									</DropdownMenuLabel>
									<DropdownMenuItem onClick={() => run(true)}>
										<RefreshCwIcon />
										Generate a fresh analysis
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>
				</CardContent>
			</Card>

			{error && <ErrorAlert error={error} onRetry={() => run(lastForce)} />}

			{loading && !analysis ? (
				<AnalysisSkeleton />
			) : analysis ? (
				<AnalysisView analysis={analysis} updatedAt={application.analysis_updated_at} dimmed={loading} />
			) : (
				<Card>
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<SparklesIcon />
							</EmptyMedia>
							<EmptyTitle>No analysis yet</EmptyTitle>
							<EmptyDescription>
								You&apos;ll get a fit score, your strengths, the gaps to address, and likely interview questions.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				</Card>
			)}
		</div>
	);
}

function AnalysisView({
	analysis,
	updatedAt,
	dimmed,
}: {
	analysis: MatchAnalysis;
	updatedAt: string | null;
	dimmed: boolean;
}) {
	return (
		<div className={`flex flex-col gap-4 transition-opacity ${dimmed ? "opacity-50" : ""}`}>
			<Card>
				<CardContent className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
					<ScoreGauge score={analysis.score} />
					<div className="flex flex-col gap-2 text-center sm:text-left">
						<span className="text-sm font-medium text-muted-foreground">Summary</span>
						<p className="text-base leading-relaxed">{analysis.summary}</p>
						{updatedAt && (
							<span className="text-xs text-muted-foreground">Analyzed {formatRelative(updatedAt)}</span>
						)}
					</div>
				</CardContent>
			</Card>

			<div className="grid gap-4 md:grid-cols-2">
				<InsightCard
					title="Strengths"
					description="What makes you a good fit"
					items={analysis.strengths}
					icon={<CheckCircle2Icon className="size-4 text-success" />}
					tone="bg-success-soft"
				/>
				<InsightCard
					title="Gaps to address"
					description="Where your CV falls short"
					items={analysis.gaps}
					icon={<CircleAlertIcon className="size-4 text-warning" />}
					tone="bg-warning-soft"
				/>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<MessageCircleQuestionIcon className="size-4 text-primary" />
						Interview prep
					</CardTitle>
					<CardDescription>Questions you&apos;re likely to be asked</CardDescription>
				</CardHeader>
				<CardContent>
					<Accordion type="single" collapsible className="w-full">
						{analysis.interview_questions.map((q, i) => (
							<AccordionItem key={i} value={`q${i}`}>
								<AccordionTrigger className="text-left">
									<span className="flex gap-3">
										<span className="font-mono text-xs leading-6 text-muted-foreground">
											{String(i + 1).padStart(2, "0")}
										</span>
										<span>{q}</span>
									</span>
								</AccordionTrigger>
								<AccordionContent className="pl-8 text-muted-foreground">
									Tip: answer with a concrete story (situation, action, result) from your CV that maps to this
									requirement.
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				</CardContent>
			</Card>
		</div>
	);
}

function InsightCard({
	title,
	description,
	items,
	icon,
	tone,
}: {
	title: string;
	description: string;
	items: string[];
	icon: React.ReactNode;
	tone: string;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<span className={`flex size-7 items-center justify-center rounded-lg ${tone}`}>{icon}</span>
					{title}
				</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent>
				<ul className="flex flex-col gap-2.5 text-sm leading-relaxed">
					{items.map((s, i) => (
						<li key={i} className="flex gap-2.5">
							<span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
							<span>{s}</span>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
}

function AnalysisSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			<Card>
				<CardContent className="flex items-center gap-6">
					<Skeleton className="size-36 rounded-full" />
					<div className="flex flex-1 flex-col gap-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-4/5" />
					</div>
				</CardContent>
			</Card>
			<div className="grid gap-4 md:grid-cols-2">
				<Skeleton className="h-48" />
				<Skeleton className="h-48" />
			</div>
		</div>
	);
}
