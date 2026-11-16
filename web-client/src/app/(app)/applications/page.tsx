"use client";

import { BriefcaseIcon, KanbanSquareIcon, ListIcon, PlusIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { toast } from "sonner";

import { CompanyAvatar } from "@/components/CompanyAvatar";
import { ErrorAlert } from "@/components/ErrorAlert";
import { KanbanBoard } from "@/components/KanbanBoard";
import { PageHeader } from "@/components/PageHeader";
import { ScorePill } from "@/components/ScoreGauge";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { toFriendlyError } from "@/lib/errors";
import { formatDate, STATUS_META } from "@/lib/format";
import { APPLICATION_STATUSES, type Application, type ApplicationStatus } from "@/lib/types";
import { useApiQuery } from "@/lib/useApiQuery";
import { useBearer } from "@/lib/useBearer";

export default function ApplicationsPage() {
	return (
		<Suspense>
			<ApplicationsInner />
		</Suspense>
	);
}

function ApplicationsInner() {
	const bearer = useBearer();
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();
	const view = params.get("view") === "board" ? "board" : "table";

	const { data: items, error, reload: load, setData: setItems } = useApiQuery<Application[]>("applications", (b) =>
		api.listApplications(b),
	);
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");

	const filtered = useMemo(() => {
		if (!items) return null;
		const q = query.trim().toLowerCase();
		return items.filter(
			(a) =>
				(statusFilter === "all" || view === "board" || a.status === statusFilter) &&
				(!q || a.title.toLowerCase().includes(q) || a.company.toLowerCase().includes(q)),
		);
	}, [items, query, statusFilter, view]);

	async function moveTo(id: string, status: ApplicationStatus) {
		if (!bearer || !items) return;
		const prev = items;
		setItems(items.map((a) => (a.id === id ? { ...a, status } : a)));
		try {
			await api.updateApplication(bearer, id, { status });
			toast.success(`Moved to ${STATUS_META[status].label}`);
		} catch (e) {
			setItems(prev);
			toast.error(toFriendlyError(e).title);
		}
	}

	function setView(v: string) {
		const next = new URLSearchParams(params);
		if (v === "board") next.set("view", "board");
		else next.delete("view");
		const qs = next.toString();
		router.replace(qs ? `${pathname}?${qs}` : pathname);
	}

	return (
		<div className="flex flex-col gap-5">
			<PageHeader
				title="Applications"
				description={items ? `${items.length} job${items.length === 1 ? "" : "s"} you're tracking` : "Loading…"}
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

			<div className="flex flex-wrap items-center gap-3">
				<Tabs value={view} onValueChange={setView}>
					<TabsList>
						<TabsTrigger value="table">
							<ListIcon />
							List
						</TabsTrigger>
						<TabsTrigger value="board">
							<KanbanSquareIcon />
							Board
						</TabsTrigger>
					</TabsList>
				</Tabs>
				<div className="relative min-w-48 flex-1 sm:max-w-xs">
					<SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search role or company"
						className="pl-8"
					/>
				</div>
				{view === "table" && (
					<Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ApplicationStatus | "all")}>
						<SelectTrigger className="w-40">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All stages</SelectItem>
							{APPLICATION_STATUSES.map((s) => (
								<SelectItem key={s} value={s}>
									{STATUS_META[s].label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}
			</div>

			{error && <ErrorAlert error={error} onRetry={load} />}

			{!filtered && !error && (
				<Card className="gap-0 p-4">
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={i} className="my-1.5 h-10 w-full" />
					))}
				</Card>
			)}

			{filtered && items && items.length === 0 && (
				<Card>
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<BriefcaseIcon />
							</EmptyMedia>
							<EmptyTitle>Start tracking your job search</EmptyTitle>
							<EmptyDescription>
								Save a job description, then let CurriClean score your CV against it.
							</EmptyDescription>
						</EmptyHeader>
						<EmptyContent>
							<Button asChild>
								<Link href="/applications/new">
									<PlusIcon />
									Add application
								</Link>
							</Button>
						</EmptyContent>
					</Empty>
				</Card>
			)}

			{filtered && items && items.length > 0 && view === "board" && (
				<KanbanBoard items={filtered} onMove={moveTo} />
			)}

			{filtered && items && items.length > 0 && view === "table" && (
				<Card className="py-0">
					<Table>
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								<TableHead className="pl-4">Role</TableHead>
								<TableHead className="hidden md:table-cell">Applied</TableHead>
								<TableHead>Match</TableHead>
								<TableHead className="pr-4 text-right">Stage</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filtered.length === 0 && (
								<TableRow>
									<TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
										No applications match your filters.
									</TableCell>
								</TableRow>
							)}
							{filtered.map((a) => (
								<TableRow
									key={a.id}
									className="cursor-pointer"
									onClick={() => router.push(`/applications/${a.id}`)}
								>
									<TableCell className="pl-4">
										<Link href={`/applications/${a.id}`} className="flex items-center gap-3">
											<CompanyAvatar name={a.company} />
											<div className="min-w-0">
												<div className="truncate font-medium">{a.title}</div>
												<div className="truncate text-xs text-muted-foreground">{a.company}</div>
											</div>
										</Link>
									</TableCell>
									<TableCell className="hidden text-muted-foreground md:table-cell">
										{formatDate(a.applied_at)}
									</TableCell>
									<TableCell>
										{a.analysis ? (
											<ScorePill score={a.analysis.score} />
										) : (
											<span className="text-xs text-muted-foreground">Not analyzed</span>
										)}
									</TableCell>
									<TableCell className="pr-4 text-right">
										<StatusBadge status={a.status} />
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</Card>
			)}
		</div>
	);
}
