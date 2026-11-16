"use client";

import { CheckCircle2Icon, XCircleIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { AuthHeading } from "@/components/AuthForm";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authApi, authErrorMessage } from "@/lib/authApi";

export default function VerifyPage() {
	return (
		<Suspense>
			<VerifyInner />
		</Suspense>
	);
}

function VerifyInner() {
	const token = useSearchParams().get("token");
	if (!token) return <Failed message="This verification link is incomplete. Open the link from your email again." />;
	return <VerifyToken token={token} />;
}

function VerifyToken({ token }: { token: string }) {
	const router = useRouter();
	const [state, setState] = useState<{ status: "pending" | "ok" | "fail"; message?: string }>({
		status: "pending",
	});

	useEffect(() => {
		authApi
			.verify(token)
			.then(() => {
				setState({ status: "ok" });
				setTimeout(() => router.push("/login?verified=1"), 1200);
			})
			.catch((e: unknown) => setState({ status: "fail", message: authErrorMessage(e) }));
	}, [token, router]);

	if (state.status === "fail") return <Failed message={state.message} />;

	return (
		<div className="flex flex-col items-center gap-4 text-center">
			{state.status === "pending" ? (
				<>
					<Spinner className="size-8 text-primary" />
					<AuthHeading title="Verifying your email…" />
				</>
			) : (
				<>
					<span className="flex size-12 items-center justify-center rounded-full bg-success-soft text-success">
						<CheckCircle2Icon className="size-6" />
					</span>
					<AuthHeading title="You're verified!" description="Taking you to sign in…" />
				</>
			)}
		</div>
	);
}

function Failed({ message }: { message?: string }) {
	return (
		<div className="flex flex-col items-center gap-4 text-center">
			<span className="flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger">
				<XCircleIcon className="size-6" />
			</span>
			<AuthHeading title="We couldn't verify your email" description={message} />
			<Button asChild variant="outline" className="w-full">
				<Link href="/login">Back to sign in</Link>
			</Button>
		</div>
	);
}
