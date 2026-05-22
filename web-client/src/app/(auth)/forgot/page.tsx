"use client";

import Link from "next/link";
import { useState } from "react";

import { authApi } from "@/lib/authApi";

export default function ForgotPage() {
	const [email, setEmail] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSubmitting(true);
		try {
			await authApi.forgot(email);
		} catch {
			// Always pretend success — backend already prevents user enumeration.
		} finally {
			setSubmitting(false);
			setSubmitted(true);
		}
	}

	if (submitted) {
		return (
			<div className="flex flex-col gap-4">
				<h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
				<p className="text-sm leading-relaxed text-[#fafafa]/80">
					If an account exists for <span className="font-mono">{email}</span>, a reset
					link is on its way.
				</p>
				<Link href="/login" className="font-mono text-xs underline">
					Back to sign in
				</Link>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<h1 className="text-2xl font-semibold tracking-tight">Forgot password</h1>
			<form onSubmit={onSubmit} className="flex flex-col gap-4">
				<label className="flex flex-col gap-1.5">
					<span className="font-mono text-xs uppercase tracking-wider text-[#64748b]">
						Email
					</span>
					<input
						type="email"
						required
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="w-full border border-[#fafafa]/60 bg-transparent px-3 py-2 outline-none focus:border-[#fafafa]"
					/>
				</label>
				<button
					type="submit"
					disabled={submitting}
					className="border border-[#fafafa] bg-[#fafafa] px-4 py-2 text-[#09090b] disabled:opacity-50"
				>
					{submitting ? "Sending…" : "Send reset link"}
				</button>
			</form>
			<Link href="/login" className="font-mono text-xs underline">
				Back to sign in
			</Link>
		</div>
	);
}
