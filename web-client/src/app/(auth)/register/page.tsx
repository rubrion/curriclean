"use client";

import { MailCheckIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AuthHeading, AuthNotice } from "@/components/AuthForm";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { authApi, authErrorMessage } from "@/lib/authApi";

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
		if (password.length < 8) return setError("Your password needs at least 8 characters.");
		if (password !== confirm) return setError("The passwords don't match.");
		setSubmitting(true);
		try {
			await authApi.register(email, password);
			setSubmitted(true);
		} catch (err) {
			setError(authErrorMessage(err));
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
					title="Check your inbox"
					description={
						<>
							We sent a verification link to <span className="font-medium text-foreground">{email}</span>. Click it to
							activate your account.
						</>
					}
				/>
				<Button asChild variant="outline" className="w-full">
					<Link href="/login">Back to sign in</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-5">
			<AuthHeading title="Create your account" description="Start with free daily analyses — no card needed." />
			<form onSubmit={onSubmit}>
				<FieldGroup>
					<Field>
						<FieldLabel htmlFor="email">Email</FieldLabel>
						<Input
							id="email"
							type="email"
							autoComplete="email"
							required
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="you@example.com"
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor="password">Password</FieldLabel>
						<Input
							id="password"
							type="password"
							autoComplete="new-password"
							required
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
						<FieldDescription>At least 8 characters.</FieldDescription>
					</Field>
					<Field>
						<FieldLabel htmlFor="confirm">Confirm password</FieldLabel>
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
						Create account
					</Button>
				</FieldGroup>
			</form>
			<p className="text-center text-sm text-muted-foreground">
				Already have an account?{" "}
				<Link href="/login" className="font-medium text-primary hover:underline">
					Sign in
				</Link>
			</p>
		</div>
	);
}
