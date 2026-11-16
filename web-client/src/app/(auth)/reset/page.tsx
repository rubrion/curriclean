"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { AuthHeading, AuthNotice } from "@/components/AuthForm";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/i18n/client";
import { authApi, authErrorKey } from "@/lib/authApi";

export default function ResetPage() {
	return (
		<Suspense>
			<ResetInner />
		</Suspense>
	);
}

function ResetInner() {
	const router = useRouter();
	const { t } = useI18n();
	const token = useSearchParams().get("token");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(
		token ? null : t("reset.incomplete"),
	);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		if (!token) return;
		if (password.length < 8) return setError(t("auth.tooShort"));
		if (password !== confirm) return setError(t("auth.mismatch"));
		setSubmitting(true);
		try {
			await authApi.reset(token, password);
			router.push("/login?reset=1");
		} catch (err) {
			setError(t(authErrorKey(err)));
			setSubmitting(false);
		}
	}

	return (
		<div className="flex flex-col gap-5">
			<AuthHeading title={t("reset.title")} />
			<form onSubmit={onSubmit}>
				<FieldGroup>
					<Field>
						<FieldLabel htmlFor="password">{t("auth.newPassword")}</FieldLabel>
						<Input
							id="password"
							type="password"
							autoComplete="new-password"
							required
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
						<FieldDescription>{t("auth.passwordHint")}</FieldDescription>
					</Field>
					<Field>
						<FieldLabel htmlFor="confirm">{t("auth.confirmPassword")}</FieldLabel>
						<Input
							id="confirm"
							type="password"
							autoComplete="new-password"
							required
							value={confirm}
							onChange={(e) => setConfirm(e.target.value)}
						/>
					</Field>
					{error && <AuthNotice kind="error">{error}</AuthNotice>}
					<Button type="submit" size="lg" disabled={submitting || !token} className="w-full">
						{submitting && <Spinner />}
						{t("reset.submit")}
					</Button>
				</FieldGroup>
			</form>
			<p className="text-center text-sm text-muted-foreground">
				<Link href="/login" className="font-medium text-primary hover:underline">
					{t("auth.backToSignIn")}
				</Link>
			</p>
		</div>
	);
}
