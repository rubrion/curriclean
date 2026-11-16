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
	const params = useSearchParams();
	const verified = params.get("verified") === "1";
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
			setError("That email and password don't match, or your email isn't verified yet.");
			return;
		}
		router.push(callbackUrl);
	}

	return (
		<div className="flex flex-col gap-5">
			<AuthHeading title="Welcome back" description="Sign in to continue your job search." />

			{verified && <AuthNotice kind="success">Email verified — you can sign in now.</AuthNotice>}
			{reset && <AuthNotice kind="success">Password updated. Sign in with your new password.</AuthNotice>}

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
						<div className="flex items-center justify-between">
							<FieldLabel htmlFor="password">Password</FieldLabel>
							<Link href="/forgot" className="text-xs text-muted-foreground hover:text-primary">
								Forgot password?
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
						Sign in
					</Button>

					{(OAUTH_GOOGLE_ENABLED || OAUTH_GITHUB_ENABLED) && (
						<>
							<FieldSeparator>or continue with</FieldSeparator>
							<div className="grid gap-2 sm:grid-cols-2">
								{OAUTH_GOOGLE_ENABLED && (
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
				New to CurriClean?{" "}
				<Link href="/register" className="font-medium text-primary hover:underline">
					Create an account
				</Link>
			</p>
		</div>
	);
}
