"use client";

import { BriefcaseIcon, ExternalLinkIcon, SearchIcon, UserRoundSearchIcon, UsersIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/i18n/client";

const linkedin = (keywords: string) =>
	`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(keywords)}`;
const google = (query: string) => `https://www.google.com/search?q=${encodeURIComponent(query)}`;

/**
 * Ready-made searches for people connected to this role. Built in the browser
 * from the title and company: no search API, and results open in the user's
 * own LinkedIn session, so they're current and complete.
 */
export function PeoplePanel({ title, company }: { title: string; company: string }) {
	const { t } = useI18n();
	const searches = [
		{
			icon: UserRoundSearchIcon,
			label: t("people.role", { title, company }),
			hint: t("people.roleHint"),
			href: linkedin(`${title} ${company}`),
			source: "LinkedIn",
		},
		{
			icon: BriefcaseIcon,
			label: t("people.recruiters", { company }),
			hint: t("people.recruitersHint"),
			href: linkedin(`${t("people.recruiterQuery")} ${company}`),
			source: "LinkedIn",
		},
		{
			icon: UsersIcon,
			label: t("people.everyone", { company }),
			hint: t("people.everyoneHint"),
			href: linkedin(company),
			source: "LinkedIn",
		},
		{
			icon: SearchIcon,
			label: t("people.google", { title, company }),
			hint: t("people.googleHint"),
			href: google(`site:linkedin.com/in "${title}" "${company}"`),
			source: "Google",
		},
	];

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("people.title")}</CardTitle>
				<CardDescription>{t("people.desc")}</CardDescription>
			</CardHeader>
			<CardContent>
				<ul className="flex flex-col divide-y rounded-lg border">
					{searches.map((s) => (
						<li key={s.href}>
							<a
								href={s.href}
								target="_blank"
								rel="noopener noreferrer"
								className="group flex items-center gap-3 p-3 transition-colors hover:bg-muted/40"
							>
								<span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-info-soft text-info">
									<s.icon className="size-4" />
								</span>
								<div className="min-w-0 flex-1">
									<div className="truncate text-sm font-medium">{s.label}</div>
									<div className="truncate text-xs text-muted-foreground">{s.hint}</div>
								</div>
								<span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground">
									{s.source}
									<ExternalLinkIcon className="size-3.5" />
								</span>
							</a>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
}
