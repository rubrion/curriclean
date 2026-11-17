import type { Metadata } from "next";

import { LegalShell } from "@/components/LegalShell";
import { PRIVACY, PRIVACY_UPDATED } from "@/content/privacy";
import { getLocale } from "@/i18n/server";

export const metadata: Metadata = {
	title: "Privacy policy",
	description: "What CurriClean collects, why, who processes it and how to delete your account.",
	alternates: { canonical: "/privacy" },
};

export default async function PrivacyPage() {
	const locale = await getLocale();
	const p = PRIVACY[locale];
	return (
		<LegalShell>
			<article className="flex flex-col gap-8">
				<header className="flex flex-col gap-2">
					<h1 className="text-3xl font-semibold tracking-tight">{p.title}</h1>
					<p className="text-sm text-muted-foreground">
						{p.updated} {PRIVACY_UPDATED}
					</p>
					<p className="text-foreground/80">{p.intro}</p>
				</header>
				{p.sections.map((s) => (
					<section key={s.title} className="flex flex-col gap-2">
						<h2 className="text-lg font-semibold">{s.title}</h2>
						{s.body.map((b) => (
							<p key={b} className="leading-relaxed text-foreground/80">
								{b}
							</p>
						))}
					</section>
				))}
			</article>
		</LegalShell>
	);
}
