"use client";

import { ArrowLeftIcon, CalendarIcon, MoreHorizontalIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { toast } from "sonner";

import { CompanyAvatar } from "@/components/CompanyAvatar";
import { CvInput } from "@/components/CvInput";
import { ErrorAlert } from "@/components/ErrorAlert";
import { MatchPanel } from "@/components/MatchPanel";
import { PeoplePanel } from "@/components/PeoplePanel";
import { TailorPanel } from "@/components/TailorPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { useI18n } from "@/i18n/client";
import { errorKeys, toFriendlyError } from "@/lib/errors";
import { formatDate, STATUS_META } from "@/lib/format";
import { APPLICATION_STATUSES, type Application, type ApplicationStatus } from "@/lib/types";
import { useApiQuery } from "@/lib/useApiQuery";
import { useBearer } from "@/lib/useBearer";
import { cn } from "@/lib/utils";

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = use(params);
	const router = useRouter();
	const bearer = useBearer();
	const { t, intl } = useI18n();
	const { data: app, error, reload: load, setData: setApp } = useApiQuery<Application>(id, (b) =>
		api.getApplication(b, id),
	);
	// CV text lives only in memory: shared by the Match and Tailor tabs, never stored.
	const [cvText, setCvText] = useState("");
	const [confirmDelete, setConfirmDelete] = useState(false);

	async function changeStatus(s: ApplicationStatus) {
		if (!app || !bearer) return;
		const prev = app;
		setApp({ ...app, status: s });
		try {
			setApp(await api.updateApplication(bearer, app.id, { status: s }));
			toast.success(t("status.movedTo", { stage: t(STATUS_META[s].label) }));
		} catch (e) {
			setApp(prev);
			toast.error(t(errorKeys(toFriendlyError(e)).title));
		}
	}

	async function onDelete() {
		if (!app || !bearer) return;
		try {
			await api.deleteApplication(bearer, app.id);
			toast.success(t("detail.deleted"));
			router.push("/applications");
		} catch (e) {
			toast.error(t(errorKeys(toFriendlyError(e)).title));
		}
	}

	if (error && !app) {
		return (
			<div className="mx-auto flex max-w-xl flex-col gap-4 pt-10">
				<ErrorAlert error={error} onRetry={load} />
				<Button asChild variant="outline" className="self-start">
					<Link href="/applications">
						<ArrowLeftIcon />
						{t("detail.backToApps")}
					</Link>
				</Button>
			</div>
		);
	}

	if (!app) return <DetailSkeleton />;

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-3">
				<Button asChild variant="ghost" size="sm" className="self-start text-muted-foreground">
					<Link href="/applications">
						<ArrowLeftIcon />
						{t("common.back")}
					</Link>
				</Button>
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div className="flex min-w-0 items-center gap-4">
						<CompanyAvatar name={app.company} className="size-12 rounded-xl text-lg" />
						<div className="min-w-0">
							<h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">{app.title}</h1>
							<div className="flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
								<span>{app.company}</span>
								<span className="flex items-center gap-1">
									<CalendarIcon className="size-3.5" />
									{formatDate(app.applied_at, intl)}
								</span>
							</div>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Select value={app.status} onValueChange={(v) => changeStatus(v as ApplicationStatus)}>
							<SelectTrigger className="w-44">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{APPLICATION_STATUSES.map((s) => (
									<SelectItem key={s} value={s}>
										<span className={cn("size-2 rounded-full", STATUS_META[s].dot)} />
										{t(STATUS_META[s].label)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="icon" aria-label={t("detail.moreActions")}>
									<MoreHorizontalIcon />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete(true)}>
									<Trash2Icon />
									{t("detail.delete")}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-5">
				<div className="flex flex-col gap-6 lg:col-span-2">
					<Card>
						<CardHeader>
							<CardTitle>{t("detail.jobDescription")}</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="max-h-[28rem] overflow-auto whitespace-pre-wrap pr-1 text-sm leading-relaxed text-foreground/85">
								{app.description}
							</div>
						</CardContent>
					</Card>
					<CvInput value={cvText} onChange={setCvText} />
				</div>

				<div className="lg:col-span-3">
					<Tabs defaultValue="match" className="gap-4">
						<TabsList className="w-full sm:w-auto">
							<TabsTrigger value="match">{t("detail.tabMatch")}</TabsTrigger>
							<TabsTrigger value="tailor">{t("detail.tabTailor")}</TabsTrigger>
							<TabsTrigger value="profiles">{t("detail.tabPeople")}</TabsTrigger>
						</TabsList>
						<TabsContent value="match">
							<MatchPanel
								application={app}
								cvText={cvText}
								onResult={(r) =>
									setApp((p) => (p ? { ...p, analysis: r.analysis, analysis_updated_at: r.updated_at } : p))
								}
							/>
						</TabsContent>
						<TabsContent value="tailor">
							<TailorPanel
								application={app}
								cvText={cvText}
								onResult={(r) =>
									setApp((p) => (p ? { ...p, tailored: r.tailored, tailored_updated_at: r.updated_at } : p))
								}
							/>
						</TabsContent>
						<TabsContent value="profiles">
							<PeoplePanel title={app.title} company={app.company} />
						</TabsContent>
					</Tabs>
				</div>
			</div>

			<Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("detail.deleteTitle")}</DialogTitle>
						<DialogDescription>
							{t("detail.deleteDesc", { title: app.title, company: app.company })}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<DialogClose asChild>
							<Button variant="outline">{t("common.cancel")}</Button>
						</DialogClose>
						<Button variant="destructive" onClick={onDelete}>
							{t("detail.deleteConfirm")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

function DetailSkeleton() {
	return (
		<div className="flex flex-col gap-6 pt-10">
			<div className="flex items-center gap-4">
				<Skeleton className="size-12 rounded-xl" />
				<div className="flex flex-col gap-2">
					<Skeleton className="h-7 w-64" />
					<Skeleton className="h-4 w-40" />
				</div>
			</div>
			<div className="grid gap-6 lg:grid-cols-5">
				<Skeleton className="h-96 lg:col-span-2" />
				<Skeleton className="h-96 lg:col-span-3" />
			</div>
		</div>
	);
}
