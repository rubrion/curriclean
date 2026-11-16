"use client";

import { FileTextIcon, UploadIcon, XIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { toFriendlyError } from "@/lib/errors";
import { useBearer } from "@/lib/useBearer";
import { cn } from "@/lib/utils";

/** Your CV: drop/upload a PDF or paste text. Kept in memory only, never saved. */
export function CvInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
	const bearer = useBearer();
	const inputRef = useRef<HTMLInputElement>(null);
	const [uploading, setUploading] = useState(false);
	const [dragging, setDragging] = useState(false);
	const [fileName, setFileName] = useState<string | null>(null);

	async function handleFile(file: File | undefined) {
		if (!file || !bearer) return;
		setUploading(true);
		try {
			const res = await api.parseCvPdf(bearer, file);
			onChange(res.text);
			setFileName(file.name);
			toast.success("CV imported from PDF");
		} catch (e) {
			const err = toFriendlyError(e);
			toast.error(err.title, { description: err.message });
		} finally {
			setUploading(false);
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Your CV</CardTitle>
				<CardDescription>Used for this session only. We never store it.</CardDescription>
				{value && (
					<CardAction>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								onChange("");
								setFileName(null);
							}}
						>
							<XIcon />
							Clear
						</Button>
					</CardAction>
				)}
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				<input
					ref={inputRef}
					type="file"
					accept="application/pdf"
					className="hidden"
					onChange={(e) => {
						void handleFile(e.target.files?.[0]);
						e.target.value = "";
					}}
				/>
				<button
					type="button"
					onClick={() => inputRef.current?.click()}
					onDragOver={(e) => {
						e.preventDefault();
						setDragging(true);
					}}
					onDragLeave={() => setDragging(false)}
					onDrop={(e) => {
						e.preventDefault();
						setDragging(false);
						void handleFile(e.dataTransfer.files?.[0]);
					}}
					disabled={uploading}
					className={cn(
						"flex flex-col items-center gap-1.5 rounded-lg border border-dashed bg-muted/30 px-4 py-5 text-center text-sm transition-colors hover:border-primary/40 hover:bg-accent/40",
						dragging && "border-primary/60 bg-accent/60",
					)}
				>
					{uploading ? (
						<Spinner className="size-5 text-primary" />
					) : fileName ? (
						<FileTextIcon className="size-5 text-primary" />
					) : (
						<UploadIcon className="size-5 text-muted-foreground" />
					)}
					<span className="font-medium">
						{uploading ? "Reading your PDF…" : fileName ?? "Drop your CV PDF here"}
					</span>
					<span className="text-xs text-muted-foreground">
						{fileName ? "Click to replace" : "or click to browse · max 5 MB"}
					</span>
				</button>
				<Textarea
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder="…or paste your CV text here"
					rows={8}
					className="max-h-80 min-h-32 text-sm"
				/>
				<span className="text-right text-xs tabular-nums text-muted-foreground">
					{value.trim().length > 0 && value.trim().length < 50
						? "A little more text, please (50+ characters)"
						: `${value.trim().split(/\s+/).filter(Boolean).length} words`}
				</span>
			</CardContent>
		</Card>
	);
}
