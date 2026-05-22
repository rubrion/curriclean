"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { api, ApiError } from "@/lib/api";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/types";
import { useBearer } from "@/lib/useBearer";

export default function NewApplicationPage() {
	const router = useRouter();
	const bearer = useBearer();
	const [company, setCompany] = useState("");
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [appliedAt, setAppliedAt] = useState(() => new Date().toISOString().slice(0, 10));
	const [statusValue, setStatusValue] = useState<ApplicationStatus>("saved");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setSubmitting(true);
		try {
			if (!bearer) {
				setError("Not signed in.");
				setSubmitting(false);
				return;
			}
			const created = await api.createApplication(bearer, {
				company: company.trim(),
				title: title.trim(),
				description,
				applied_at: new Date(appliedAt).toISOString(),
				status: statusValue,
			});
			router.push(`/applications/${created.id}`);
		} catch (e: unknown) {
			const msg = e instanceof ApiError ? e.message : "Failed to create application.";
			setError(msg);
			setSubmitting(false);
		}
	}

	return (
		<div className="flex flex-col gap-6">
			<h1 className="text-2xl font-semibold tracking-tight">New application</h1>
			<form onSubmit={onSubmit} className="flex flex-col gap-4">
				<Field label="Company">
					<input
						required
						value={company}
						onChange={(e) => setCompany(e.target.value)}
						className="w-full border border-[#fafafa]/60 bg-transparent px-3 py-2 outline-none focus:border-[#fafafa]"
					/>
				</Field>
				<Field label="Title">
					<input
						required
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className="w-full border border-[#fafafa]/60 bg-transparent px-3 py-2 outline-none focus:border-[#fafafa]"
					/>
				</Field>
				<Field label="Description (job description)">
					<textarea
						required
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						rows={10}
						className="w-full border border-[#fafafa]/60 bg-transparent px-3 py-2 font-mono text-sm outline-none focus:border-[#fafafa]"
					/>
				</Field>
				<div className="grid grid-cols-2 gap-4">
					<Field label="Applied date">
						<input
							type="date"
							required
							value={appliedAt}
							onChange={(e) => setAppliedAt(e.target.value)}
							className="w-full border border-[#fafafa]/60 bg-transparent px-3 py-2 outline-none focus:border-[#fafafa]"
						/>
					</Field>
					<Field label="Status">
						<select
							value={statusValue}
							onChange={(e) => setStatusValue(e.target.value as ApplicationStatus)}
							className="w-full border border-[#fafafa]/60 bg-transparent px-3 py-2 outline-none focus:border-[#fafafa]"
						>
							{APPLICATION_STATUSES.map((s) => (
								<option key={s} value={s} className="bg-[#09090b]">
									{s}
								</option>
							))}
						</select>
					</Field>
				</div>
				{error && (
					<div className="border border-[#fafafa] p-3 font-mono text-sm">{error}</div>
				)}
				<div className="flex gap-3">
					<button
						type="submit"
						disabled={submitting}
						className="border border-[#fafafa] bg-[#fafafa] px-4 py-2 text-[#09090b] disabled:opacity-50"
					>
						{submitting ? "Saving…" : "Create"}
					</button>
					<button
						type="button"
						onClick={() => router.back()}
						className="border border-[#fafafa]/60 px-4 py-2 hover:border-[#fafafa]"
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<label className="flex flex-col gap-1.5">
			<span className="font-mono text-xs uppercase tracking-wider text-[#64748b]">{label}</span>
			{children}
		</label>
	);
}
