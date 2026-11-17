"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense, useState } from "react";

import { AuthHeading, AuthNotice } from "@/components/AuthForm";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/i18n/client";
import { useInStoreApp } from "@/lib/storeAppContext";

const OAUTH_GOOGLE_ENABLED = process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "1";
const OAUTH_GITHUB_ENABLED = process.env.NEXT_PUBLIC_AUTH_GITHUB_ENABLED === "1";

export default function LoginPage() {
	return (
		<Suspense>
			<LoginInner />
		</Suspense>
	);
}

function LoginInner() {
	const router = useRouter();
	const { t } = useI18n();
	const params = useSearchParams();
	// Google refuses sign-in inside app web views (disallowed_useragent).
	const storeApp = useInStoreApp();
	const google = OAUTH_GOOGLE_ENABLED && !storeApp;
	const verified = params.get("verified") === "1";
	const deleted = params.get("deleted") === "1";
	const reset = params.get("reset") === "1";
	const callbackUrl = params.get("callbackUrl") ?? "/dashboard";

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setSubmitting(true);
		const res = await signIn("credentials", { email, password, redirect: false });
		if (!res || res.error) {
			setSubmitting(false);
			setError(t("login.invalid"));
			return;
		}
		router.push(callbackUrl);
	}

	return (
		<div className="flex flex-col gap-5">
			<AuthHeading title={t("login.title")} description={t("login.subtitle")} />

			{verified && <AuthNotice kind="success">{t("login.verified")}</AuthNotice>}
			{deleted && <AuthNotice kind="success">{t("login.deleted")}</AuthNotice>}
			{reset && <AuthNotice kind="success">{t("login.reset")}</AuthNotice>}

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
						<div className="flex items-center justify-between">
							<FieldLabel htmlFor="password">{t("auth.password")}</FieldLabel>
							<Link href="/forgot" className="text-xs text-muted-foreground hover:text-primary">
								{t("login.forgot")}
							</Link>
						</div>
						<Input
							id="password"
							type="password"
							autoComplete="current-password"
							required
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
					</Field>
					{error && <AuthNotice kind="error">{error}</AuthNotice>}
					<Button type="submit" size="lg" disabled={submitting} className="w-full">
						{submitting && <Spinner />}
						{t("login.submit")}
					</Button>

					{(google || OAUTH_GITHUB_ENABLED) && (
						<>
							<FieldSeparator>{t("login.or")}</FieldSeparator>
							<div className={google && OAUTH_GITHUB_ENABLED ? "grid gap-2 sm:grid-cols-2" : "grid gap-2"}>
								{google && (
									<Button type="button" variant="outline" size="lg" onClick={() => signIn("google", { callbackUrl })}>
										Google
									</Button>
								)}
								{OAUTH_GITHUB_ENABLED && (
									<Button type="button" variant="outline" size="lg" onClick={() => signIn("github", { callbackUrl })}>
										GitHub
									</Button>
								)}
							</div>
						</>
					)}
				</FieldGroup>
			</form>

			<p className="text-center text-sm text-muted-foreground">
				{t("login.newHere")}{" "}
				<Link href="/register" className="font-medium text-primary hover:underline">
					{t("login.createAccount")}
				</Link>
			</p>
		</div>
	);
}
