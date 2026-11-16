"use client";

import {
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	KeyboardSensor,
	PointerSensor,
	useDraggable,
	useDroppable,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import Link from "next/link";
import { useState } from "react";

import { CompanyAvatar } from "@/components/CompanyAvatar";
import { ScorePill } from "@/components/ScoreGauge";
import { useI18n } from "@/i18n/client";
import { formatDate, STATUS_META } from "@/lib/format";
import { APPLICATION_STATUSES, type Application, type ApplicationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Drag applications between pipeline stages; dropping calls `onMove`. */
export function KanbanBoard({
	items,
	onMove,
}: {
	items: Application[];
	onMove: (id: string, status: ApplicationStatus) => void;
}) {
	const [active, setActive] = useState<Application | null>(null);
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
		useSensor(KeyboardSensor),
	);

	function onDragStart(e: DragStartEvent) {
		setActive(items.find((a) => a.id === e.active.id) ?? null);
	}

	function onDragEnd(e: DragEndEvent) {
		setActive(null);
		const status = e.over?.id as ApplicationStatus | undefined;
		const app = items.find((a) => a.id === e.active.id);
		if (app && status && app.status !== status) onMove(app.id, status);
	}

	return (
		<DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActive(null)}>
			<div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
				{APPLICATION_STATUSES.map((status) => (
					<Column key={status} status={status} items={items.filter((a) => a.status === status)} />
				))}
			</div>
			<DragOverlay dropAnimation={null}>
				{active ? <CardBody app={active} className="rotate-2 shadow-soft ring-2 ring-primary/30" /> : null}
			</DragOverlay>
		</DndContext>
	);
}

function Column({ status, items }: { status: ApplicationStatus; items: Application[] }) {
	const { setNodeRef, isOver } = useDroppable({ id: status });
	const { t } = useI18n();
	const meta = STATUS_META[status];
	return (
		<div
			ref={setNodeRef}
			className={cn(
				"flex w-64 shrink-0 snap-start flex-col gap-2 rounded-xl border bg-muted/40 p-2 transition-colors",
				isOver && "border-primary/40 bg-accent/60",
			)}
		>
			<div className="flex items-center justify-between px-1.5 py-1">
				<span className="flex items-center gap-2 text-sm font-medium">
					<span className={cn("size-2 rounded-full", meta.dot)} />
					{t(meta.label)}
				</span>
				<span className="rounded-full bg-background px-2 text-xs tabular-nums text-muted-foreground">
					{items.length}
				</span>
			</div>
			<div className="flex min-h-24 flex-col gap-2">
				{items.map((a) => (
					<DraggableCard key={a.id} app={a} />
				))}
				{items.length === 0 && (
					<div className="flex flex-1 items-center justify-center rounded-lg border border-dashed py-6 text-xs text-muted-foreground">
						{t("board.dropHere")}
					</div>
				)}
			</div>
		</div>
	);
}

function DraggableCard({ app }: { app: Application }) {
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: app.id });
	return (
		<div ref={setNodeRef} {...listeners} {...attributes} className={cn("touch-none", isDragging && "opacity-40")}>
			<CardBody app={app} />
		</div>
	);
}

function CardBody({ app, className }: { app: Application; className?: string }) {
	const { intl } = useI18n();
	return (
		<Link
			href={`/applications/${app.id}`}
			draggable={false}
			className={cn(
				"flex flex-col gap-2 rounded-lg border bg-card p-3 text-sm transition-shadow hover:shadow-soft",
				className,
			)}
		>
			<div className="flex items-start gap-2.5">
				<CompanyAvatar name={app.company} className="size-7 text-xs" />
				<div className="min-w-0 flex-1">
					<div className="line-clamp-2 leading-snug font-medium">{app.title}</div>
					<div className="truncate text-xs text-muted-foreground">{app.company}</div>
				</div>
			</div>
			<div className="flex items-center justify-between text-xs text-muted-foreground">
				<span>{formatDate(app.applied_at, intl)}</span>
				{app.analysis && <ScorePill score={app.analysis.score} />}
			</div>
		</Link>
	);
}
