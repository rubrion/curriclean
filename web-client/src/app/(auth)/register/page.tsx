"use client";

import Link from "next/link";
import { useState } from "react";

import { authApi } from "@/lib/authApi";

export default function RegisterPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [submitted, setSubmitted] = useState(false);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
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
			await authApi.register(email, password);
			setSubmitted(true);
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Failed to register.");
		} finally {
			setSubmitting(false);
		}
	}

	if (submitted) {
		return (
			<div className="flex flex-col gap-4">
				<h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
				<p className="text-sm leading-relaxed text-[#fafafa]/80">
					We sent a verification link to <span className="font-mono">{email}</span>.
					Click it to activate your account, then sign in.
				</p>
				<Link href="/login" className="font-mono text-xs underline">
					Back to sign in
				</Link>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
			<form onSubmit={onSubmit} className="flex flex-col gap-4">
				<Field label="Email">
					<input
						type="email"
						required
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="w-full border border-[#fafafa]/60 bg-transparent px-3 py-2 outline-none focus:border-[#fafafa]"
					/>
				</Field>
				<Field label="Password (min 8 chars)">
					<input
						type="password"
						required
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="w-full border border-[#fafafa]/60 bg-transparent px-3 py-2 outline-none focus:border-[#fafafa]"
					/>
				</Field>
				<Field label="Confirm password">
					<input
						type="password"
						required
						value={confirm}
						onChange={(e) => setConfirm(e.target.value)}
						className="w-full border border-[#fafafa]/60 bg-transparent px-3 py-2 outline-none focus:border-[#fafafa]"
					/>
				</Field>
				{error && (
					<div className="border border-[#fafafa] p-3 font-mono text-sm">{error}</div>
				)}
				<button
					type="submit"
					disabled={submitting}
					className="border border-[#fafafa] bg-[#fafafa] px-4 py-2 text-[#09090b] disabled:opacity-50"
				>
					{submitting ? "Creating…" : "Create account"}
				</button>
			</form>
			<div className="font-mono text-xs text-[#64748b]">
				Already have an account?{" "}
				<Link href="/login" className="hover:underline">
					Sign in
				</Link>
			</div>
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
