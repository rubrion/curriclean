"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { authApi } from "@/lib/authApi";

export default function ResetPage() {
	return (
		<Suspense fallback={<div className="font-mono text-sm text-[#64748b]">Loading…</div>}>
			<ResetInner />
		</Suspense>
	);
}

function ResetInner() {
	const router = useRouter();
	const params = useSearchParams();
	const token = params.get("token");

	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		if (!token) {
			setError("Missing token.");
			return;
		}
		if (password !== confirm) {
			setError("Passwords do not match.");
			return;
		}
		if (password.length < 8) {
			setError("Password must be at least 8 characters.");
			return;
		}
		setSubmitting(true);
		try {
			await authApi.reset(token, password);
			router.push("/login?reset=1");
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Reset failed.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="flex flex-col gap-6">
			<h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
			<form onSubmit={onSubmit} className="flex flex-col gap-4">
				<label className="flex flex-col gap-1.5">
					<span className="font-mono text-xs uppercase tracking-wider text-[#64748b]">
						New password (min 8 chars)
					</span>
					<input
						type="password"
						required
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="w-full border border-[#fafafa]/60 bg-transparent px-3 py-2 outline-none focus:border-[#fafafa]"
					/>
				</label>
				<label className="flex flex-col gap-1.5">
					<span className="font-mono text-xs uppercase tracking-wider text-[#64748b]">
						Confirm password
					</span>
					<input
						type="password"
						required
						value={confirm}
						onChange={(e) => setConfirm(e.target.value)}
						className="w-full border border-[#fafafa]/60 bg-transparent px-3 py-2 outline-none focus:border-[#fafafa]"
					/>
				</label>
				{error && (
					<div className="border border-[#fafafa] p-3 font-mono text-sm">{error}</div>
				)}
				<button
					type="submit"
					disabled={submitting || !token}
					className="border border-[#fafafa] bg-[#fafafa] px-4 py-2 text-[#09090b] disabled:opacity-50"
				>
					{submitting ? "Resetting…" : "Reset password"}
				</button>
			</form>
			<Link href="/login" className="font-mono text-xs underline">
				Back to sign in
			</Link>
		</div>
	);
}
