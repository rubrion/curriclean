"use client";

import { MailCheckIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AuthHeading, AuthNotice } from "@/components/AuthForm";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/i18n/client";
import { authApi, authErrorKey } from "@/lib/authApi";

export default function RegisterPage() {
	const { t } = useI18n();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [submitted, setSubmitted] = useState(false);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		if (password.length < 8) return setError(t("auth.tooShort"));
		if (password !== confirm) return setError(t("auth.mismatch"));
		setSubmitting(true);
		try {
			await authApi.register(email, password);
			setSubmitted(true);
		} catch (err) {
			setError(t(authErrorKey(err)));
		} finally {
			setSubmitting(false);
		}
	}

	if (submitted) {
		return (
			<div className="flex flex-col items-center gap-4 text-center">
				<span className="flex size-12 items-center justify-center rounded-full bg-success-soft text-success">
					<MailCheckIcon className="size-6" />
				</span>
				<AuthHeading
					title={t("auth.checkInbox")}
					description={t("register.sent", { email })}
				/>
				<Button asChild variant="outline" className="w-full">
					<Link href="/login">{t("auth.backToSignIn")}</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-5">
			<AuthHeading title={t("register.title")} description={t("register.subtitle")} />
			<form onSubmit={onSubmit}>
				<FieldGroup>
					<Field>
						<FieldLabel htmlFor="email">{t("auth.email")}</FieldLabel>
						<Input
							id="email"
							type="email"
							autoComplete="email"
							required
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder={t("auth.emailPlaceholder")}
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor="password">{t("auth.password")}</FieldLabel>
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
					<Button type="submit" size="lg" disabled={submitting} className="w-full">
						{submitting && <Spinner />}
						{t("register.submit")}
					</Button>
				</FieldGroup>
			</form>
			<p className="text-center text-sm text-muted-foreground">
				{t("register.haveAccount")}{" "}
				<Link href="/login" className="font-medium text-primary hover:underline">
					{t("register.signIn")}
				</Link>
			</p>
		</div>
	);
}
