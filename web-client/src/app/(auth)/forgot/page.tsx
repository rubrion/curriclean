"use client";

import { MailIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AuthHeading } from "@/components/AuthForm";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/i18n/client";
import { authApi } from "@/lib/authApi";

export default function ForgotPage() {
	const { t } = useI18n();
	const [email, setEmail] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSubmitting(true);
		try {
			await authApi.forgot(email);
		} catch {
			// Always show the same result — the backend prevents user enumeration.
		} finally {
			setSubmitting(false);
			setSubmitted(true);
		}
	}

	if (submitted) {
		return (
			<div className="flex flex-col items-center gap-4 text-center">
				<span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
					<MailIcon className="size-6" />
				</span>
				<AuthHeading
					title={t("auth.checkInbox")}
					description={t("forgot.sent", { email })}
				/>
				<Button asChild variant="outline" className="w-full">
					<Link href="/login">{t("auth.backToSignIn")}</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-5">
			<AuthHeading title={t("forgot.title")} description={t("forgot.subtitle")} />
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
					<Button type="submit" size="lg" disabled={submitting} className="w-full">
						{submitting && <Spinner />}
						{t("forgot.submit")}
					</Button>
				</FieldGroup>
			</form>
			<p className="text-center text-sm text-muted-foreground">
				{t("forgot.remembered")}{" "}
				<Link href="/login" className="font-medium text-primary hover:underline">
					{t("register.signIn")}
				</Link>
			</p>
		</div>
	);
}
