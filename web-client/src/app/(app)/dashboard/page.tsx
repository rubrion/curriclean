"use client";

import {
	ArrowRightIcon,
	BriefcaseIcon,
	CoinsIcon,
	GaugeIcon,
	MessagesSquareIcon,
	PlusIcon,
} from "lucide-react";
import Link from "next/link";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import { CompanyAvatar } from "@/components/CompanyAvatar";
import { ErrorAlert } from "@/components/ErrorAlert";
import { PageHeader } from "@/components/PageHeader";
import { ScorePill } from "@/components/ScoreGauge";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useBilling } from "@/lib/billing";
import { formatRelative, STATUS_META } from "@/lib/format";
import { APPLICATION_STATUSES, type Application, type ApplicationStats } from "@/lib/types";
import { useApiQuery } from "@/lib/useApiQuery";
import { useSession } from "next-auth/react";

const STATUS_COLORS: Record<string, string> = {
	saved: "var(--muted-foreground)",
	applied: "var(--info)",
	interviewing: "var(--warning)",
	offer: "var(--success)",
	rejected: "var(--danger)",
	withdrawn: "var(--border)",
};

const scoreConfig = { score: { label: "Match score", color: "var(--chart-1)" } } satisfies ChartConfig;
const statusConfig = { count: { label: "Applications" } } satisfies ChartConfig;

export default function DashboardPage() {
	const { data: session } = useSession();
	const { billing } = useBilling();
	const { data, error, reload: load } = useApiQuery("dashboard", (b) =>
		Promise.all([api.getStats(b), api.listApplications(b)]),
	);
	const stats: ApplicationStats | null = data?.[0] ?? null;
	const recent: Application[] | null = data ? data[1].slice(0, 5) : null;

	const firstName = session?.user?.name?.split(" ")[0];
	const loading = !stats && !error;

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title={firstName ? `Welcome back, ${firstName}` : "Welcome back"}
				description="Here's how your job search is going."
				actions={
					<Button asChild>
						<Link href="/applications/new">
							<PlusIcon />
							New application
						</Link>
					</Button>
				}
				className="pb-0"
			/>

			{error && <ErrorAlert error={error} onRetry={load} />}

			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				<KpiCard
					icon={BriefcaseIcon}
					label="Applications"
					value={stats?.total}
					hint={stats ? `${stats.by_status.saved} saved for later` : undefined}
					loading={loading}
				/>
				<KpiCard
					icon={MessagesSquareIcon}
					label="In progress"
					value={stats ? stats.by_status.applied + stats.by_status.interviewing : undefined}
					hint={stats ? `${stats.by_status.interviewing} interviewing · ${stats.by_status.offer} offers` : undefined}
					loading={loading}
				/>
				<KpiCard
					icon={GaugeIcon}
					label="Average match"
					value={stats ? (stats.average_score !== null ? `${stats.average_score}%` : "—") : undefined}
					hint={stats ? `${stats.analyzed} analyzed` : undefined}
					loading={loading}
				/>
				<KpiCard
					icon={CoinsIcon}
					label="Credits"
					value={billing?.credits}
					hint={billing ? `${billing.free_runs_left} free runs left today` : undefined}
					loading={!billing}
					href="/billing"
				/>
			</div>

			<div className="grid gap-4 lg:grid-cols-5">
				<Card className="lg:col-span-3">
					<CardHeader>
						<CardTitle>Match scores</CardTitle>
						<CardDescription>How well your CV fits each role, by application date</CardDescription>
					</CardHeader>
					<CardContent>
						{loading ? (
							<Skeleton className="h-56 w-full" />
						) : stats && stats.scores.length > 1 ? (
							<ChartContainer config={scoreConfig} className="aspect-auto h-56 w-full">
								<AreaChart data={stats.scores} margin={{ left: -20, right: 8, top: 8 }}>
									<defs>
										<linearGradient id="fillScore" x1="0" y1="0" x2="0" y2="1">
											<stop offset="5%" stopColor="var(--color-score)" stopOpacity={0.35} />
											<stop offset="95%" stopColor="var(--color-score)" stopOpacity={0.02} />
										</linearGradient>
									</defs>
									<CartesianGrid vertical={false} strokeDasharray="3 3" />
									<XAxis
										dataKey="applied_at"
										tickLine={false}
										axisLine={false}
										tickMargin={8}
										minTickGap={24}
										tickFormatter={(v: string) =>
											new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })
										}
									/>
									<YAxis domain={[0, 100]} tickLine={false} axisLine={false} tickCount={5} />
									<ChartTooltip
										cursor={false}
										content={
											<ChartTooltipContent
												labelFormatter={(_, p) => {
													const row = p?.[0]?.payload as ApplicationStats["scores"][number] | undefined;
													return row ? `${row.title} · ${row.company}` : "";
												}}
											/>
										}
									/>
									<Area
										dataKey="score"
										type="monotone"
										stroke="var(--color-score)"
										strokeWidth={2}
										fill="url(#fillScore)"
										dot={{ r: 3, fill: "var(--color-score)" }}
									/>
								</AreaChart>
							</ChartContainer>
						) : (
							<ChartPlaceholder text="Analyze at least two applications to see your score trend." />
						)}
					</CardContent>
				</Card>

				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Pipeline</CardTitle>
						<CardDescription>Applications by stage</CardDescription>
						<CardAction>
							<Button asChild variant="ghost" size="sm">
								<Link href="/applications?view=board">
									Board
									<ArrowRightIcon />
								</Link>
							</Button>
						</CardAction>
					</CardHeader>
					<CardContent>
						{loading ? (
							<Skeleton className="h-56 w-full" />
						) : stats && stats.total > 0 ? (
							<ChartContainer config={statusConfig} className="aspect-auto h-56 w-full">
								<BarChart
									layout="vertical"
									data={APPLICATION_STATUSES.map((s) => ({
										status: STATUS_META[s].label,
										key: s,
										count: stats.by_status[s],
									}))}
									margin={{ left: 8, right: 16 }}
								>
									<XAxis type="number" hide allowDecimals={false} />
									<YAxis
										type="category"
										dataKey="status"
										tickLine={false}
										axisLine={false}
										width={88}
									/>
									<ChartTooltip cursor={false} content={<ChartTooltipContent hideIndicator />} />
									<Bar dataKey="count" radius={6} barSize={18}>
										{APPLICATION_STATUSES.map((s) => (
											<Cell key={s} fill={STATUS_COLORS[s]} />
										))}
									</Bar>
								</BarChart>
							</ChartContainer>
						) : (
							<ChartPlaceholder text="Your pipeline will show up here once you add applications." />
						)}
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Recent applications</CardTitle>
					<CardAction>
						<Button asChild variant="ghost" size="sm">
							<Link href="/applications">
								View all
								<ArrowRightIcon />
							</Link>
						</Button>
					</CardAction>
				</CardHeader>
				<CardContent className="px-0">
					{!recent ? (
						<div className="flex flex-col gap-2 px-4">
							{Array.from({ length: 3 }).map((_, i) => (
								<Skeleton key={i} className="h-12 w-full" />
							))}
						</div>
					) : recent.length === 0 ? (
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<BriefcaseIcon />
								</EmptyMedia>
								<EmptyTitle>No applications yet</EmptyTitle>
								<EmptyDescription>
									Add a job you&apos;re interested in, then see how your CV matches it.
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								<Button asChild>
									<Link href="/applications/new">
										<PlusIcon />
										Add your first application
									</Link>
								</Button>
							</EmptyContent>
						</Empty>
					) : (
						<ul className="divide-y">
							{recent.map((a) => (
								<li key={a.id}>
									<Link
										href={`/applications/${a.id}`}
										className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
									>
										<CompanyAvatar name={a.company} />
										<div className="min-w-0 flex-1">
											<div className="truncate font-medium">{a.title}</div>
											<div className="truncate text-xs text-muted-foreground">
												{a.company} · updated {formatRelative(a.updated_at)}
											</div>
										</div>
										{a.analysis && <ScorePill score={a.analysis.score} />}
										<StatusBadge status={a.status} className="hidden sm:inline-flex" />
									</Link>
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

function KpiCard({
	icon: Icon,
	label,
	value,
	hint,
	loading,
	href,
}: {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	value: React.ReactNode;
	hint?: string;
	loading: boolean;
	href?: string;
}) {
	const body = (
		<Card size="sm" className="h-full transition-shadow hover:shadow-soft">
			<CardContent className="flex flex-col gap-3">
				<div className="flex items-center justify-between text-muted-foreground">
					<span className="text-sm">{label}</span>
					<span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
						<Icon className="size-4" />
					</span>
				</div>
				{loading ? (
					<Skeleton className="h-8 w-16" />
				) : (
					<span className="text-3xl font-semibold tabular-nums tracking-tight">{value ?? "—"}</span>
				)}
				{loading ? (
					<Skeleton className="h-3 w-24" />
				) : (
					hint && <span className="truncate text-xs text-muted-foreground">{hint}</span>
				)}
			</CardContent>
		</Card>
	);
	return href ? <Link href={href}>{body}</Link> : body;
}

function ChartPlaceholder({ text }: { text: string }) {
	return (
		<div className="flex h-56 items-center justify-center rounded-lg border border-dashed bg-muted/30 px-6 text-center text-sm text-muted-foreground">
			{text}
		</div>
	);
}
