"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { authApi } from "@/lib/authApi";

export default function VerifyPage() {
	return (
		<Suspense fallback={<div className="font-mono text-sm text-[#64748b]">Loading…</div>}>
			<VerifyInner />
		</Suspense>
	);
}

function VerifyInner() {
	const router = useRouter();
	const params = useSearchParams();
	const token = params.get("token");
	const [state, setState] = useState<"pending" | "ok" | "fail">("pending");
	const [message, setMessage] = useState<string | null>(null);

	useEffect(() => {
		if (!token) {
			setState("fail");
			setMessage("Missing token.");
			return;
		}
		authApi
			.verify(token)
			.then(() => {
				setState("ok");
				setTimeout(() => router.push("/login?verified=1"), 1200);
			})
			.catch((e: unknown) => {
				setState("fail");
				setMessage(e instanceof Error ? e.message : "Verification failed.");
			});
	}, [token, router]);

	return (
		<div className="flex flex-col gap-4">
			<h1 className="text-2xl font-semibold tracking-tight">Email verification</h1>
			{state === "pending" && (
				<div className="font-mono text-sm text-[#64748b]">Verifying…</div>
			)}
			{state === "ok" && (
				<div className="font-mono text-sm">Verified. Redirecting to sign in…</div>
			)}
			{state === "fail" && (
				<div className="flex flex-col gap-3">
					<div className="border border-[#fafafa] p-3 font-mono text-sm">
						{message ?? "Verification failed."}
					</div>
					<Link href="/login" className="font-mono text-xs underline">
						Back to sign in
					</Link>
				</div>
			)}
		</div>
	);
}
