"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense, useState } from "react";

const OAUTH_GOOGLE_ENABLED = process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "1";
const OAUTH_GITHUB_ENABLED = process.env.NEXT_PUBLIC_AUTH_GITHUB_ENABLED === "1";

export default function LoginPage() {
	return (
		<Suspense fallback={<div className="font-mono text-sm text-[#64748b]">Loading…</div>}>
			<LoginInner />
		</Suspense>
	);
}

function LoginInner() {
	const router = useRouter();
	const params = useSearchParams();
	const verified = params.get("verified") === "1";
	const reset = params.get("reset") === "1";
	const callbackUrl = params.get("callbackUrl") ?? "/applications";

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setSubmitting(true);
		const res = await signIn("credentials", {
			email,
			password,
			redirect: false,
		});
		setSubmitting(false);
		if (!res || res.error) {
			setError("Invalid email or password, or email not verified.");
			return;
		}
		router.push(callbackUrl);
	}

	return (
		<div className="flex flex-col gap-6">
			<h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>

			{verified && (
				<div className="border border-[#fafafa]/40 p-3 font-mono text-xs">
					Email verified. You can sign in now.
				</div>
			)}
			{reset && (
				<div className="border border-[#fafafa]/40 p-3 font-mono text-xs">
					Password reset. Sign in with your new password.
				</div>
			)}

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
				<Field label="Password">
					<input
						type="password"
						required
						value={password}
						onChange={(e) => setPassword(e.target.value)}
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
					{submitting ? "Signing in…" : "Sign in"}
				</button>
			</form>

			{(OAUTH_GOOGLE_ENABLED || OAUTH_GITHUB_ENABLED) && (
				<div className="flex flex-col gap-2">
					<div className="text-center font-mono text-xs uppercase tracking-wider text-[#64748b]">
						or
					</div>
					{OAUTH_GOOGLE_ENABLED && (
						<button
							type="button"
							onClick={() => signIn("google", { callbackUrl })}
							className="border border-[#fafafa]/60 px-4 py-2 transition-colors hover:border-[#fafafa] hover:bg-[#fafafa] hover:text-[#09090b]"
						>
							Continue with Google
						</button>
					)}
					{OAUTH_GITHUB_ENABLED && (
						<button
							type="button"
							onClick={() => signIn("github", { callbackUrl })}
							className="border border-[#fafafa]/60 px-4 py-2 transition-colors hover:border-[#fafafa] hover:bg-[#fafafa] hover:text-[#09090b]"
						>
							Continue with GitHub
						</button>
					)}
				</div>
			)}

			<div className="flex justify-between font-mono text-xs text-[#64748b]">
				<Link href="/register" className="hover:underline">
					Create account
				</Link>
				<Link href="/forgot" className="hover:underline">
					Forgot password?
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
