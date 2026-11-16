"use client";

import { CheckCircle2Icon, XCircleIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { AuthHeading } from "@/components/AuthForm";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/i18n/client";
import type { TKey } from "@/i18n/dictionaries";
import { authApi, authErrorKey } from "@/lib/authApi";

export default function VerifyPage() {
	return (
		<Suspense>
			<VerifyInner />
		</Suspense>
	);
}

function VerifyInner() {
	const token = useSearchParams().get("token");
	const { t } = useI18n();
	if (!token) return <Failed message={t("verify.incomplete")} />;
	return <VerifyToken token={token} />;
}

function VerifyToken({ token }: { token: string }) {
	const router = useRouter();
	const { t } = useI18n();
	const [state, setState] = useState<{ status: "pending" | "ok" | "fail"; key?: TKey }>({
		status: "pending",
	});

	useEffect(() => {
		authApi
			.verify(token)
			.then(() => {
				setState({ status: "ok" });
				setTimeout(() => router.push("/login?verified=1"), 1200);
			})
			.catch((e: unknown) => setState({ status: "fail", key: authErrorKey(e) }));
	}, [token, router]);

	if (state.status === "fail") return <Failed message={state.key ? t(state.key) : undefined} />;

	return (
		<div className="flex flex-col items-center gap-4 text-center">
			{state.status === "pending" ? (
				<>
					<Spinner className="size-8 text-primary" />
					<AuthHeading title={t("verify.pending")} />
				</>
			) : (
				<>
					<span className="flex size-12 items-center justify-center rounded-full bg-success-soft text-success">
						<CheckCircle2Icon className="size-6" />
					</span>
					<AuthHeading title={t("verify.ok")} description={t("verify.redirecting")} />
				</>
			)}
		</div>
	);
}

function Failed({ message }: { message?: string }) {
	const { t } = useI18n();
	return (
		<div className="flex flex-col items-center gap-4 text-center">
			<span className="flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger">
				<XCircleIcon className="size-6" />
			</span>
			<AuthHeading title={t("verify.failed")} description={message} />
			<Button asChild variant="outline" className="w-full">
				<Link href="/login">{t("auth.backToSignIn")}</Link>
			</Button>
		</div>
	);
}
