import type { Metadata } from "next";
import Link from "next/link";

import { DeleteAccountButton } from "@/components/DeleteAccountDialog";
import { LegalShell } from "@/components/LegalShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getT } from "@/i18n/server";
import { auth } from "@/lib/auth";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
	title: "Delete your account",
	description: "Delete your CurriClean account and all its data.",
	alternates: { canonical: "/delete-account" },
};

/** Public account-deletion page (the URL Google Play asks for). */
export default async function DeleteAccountPage() {
	const [t, session] = await Promise.all([getT(), auth()]);
	const email = session?.user?.email;
	return (
		<LegalShell>
			<div className="flex flex-col gap-6">
				<header className="flex flex-col gap-2">
					<h1 className="text-3xl font-semibold tracking-tight">{t("delete.pageTitle")}</h1>
					<p className="text-foreground/80">{t("delete.pageIntro")}</p>
				</header>
				<Card>
					<CardContent className="flex flex-col gap-4">
						<h2 className="font-semibold">{t("delete.pageWhat")}</h2>
						<ul className="list-disc space-y-1 pl-5 text-sm text-foreground/80">
							{t("delete.pageItems")
								.split("|")
								.map((item) => (
									<li key={item}>{item}</li>
								))}
						</ul>
						<p className="text-sm text-muted-foreground">{t("delete.pageKept")}</p>
						{session ? (
							<div className="flex flex-col items-start gap-3">
								{email && (
									<p className="text-sm text-muted-foreground">{t("delete.pageSignedIn", { email })}</p>
								)}
								<DeleteAccountButton />
							</div>
						) : (
							<Button asChild className="self-start">
								<Link href="/login?callbackUrl=/delete-account">{t("delete.pageSignIn")}</Link>
							</Button>
						)}
					</CardContent>
				</Card>
				<p className="text-sm text-muted-foreground">
					{t("delete.pageEmail", { email: CONTACT_EMAIL })}
				</p>
			</div>
		</LegalShell>
	);
}
