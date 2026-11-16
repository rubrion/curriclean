import { BriefcaseIcon, ExternalLinkIcon, SearchIcon, UserRoundSearchIcon, UsersIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const linkedin = (keywords: string) =>
	`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(keywords)}`;
const google = (query: string) => `https://www.google.com/search?q=${encodeURIComponent(query)}`;

/**
 * Ready-made searches for people connected to this role. Built in the browser
 * from the title and company: no search API, and results open in the user's
 * own LinkedIn session, so they're current and complete.
 */
export function PeoplePanel({ title, company }: { title: string; company: string }) {
	const searches = [
		{
			icon: UserRoundSearchIcon,
			label: `${title} at ${company}`,
			hint: "People doing this job there today — ask about the team",
			href: linkedin(`${title} ${company}`),
			source: "LinkedIn",
		},
		{
			icon: BriefcaseIcon,
			label: `Recruiters at ${company}`,
			hint: "Talent acquisition who might own this opening",
			href: linkedin(`recruiter talent acquisition ${company}`),
			source: "LinkedIn",
		},
		{
			icon: UsersIcon,
			label: `Everyone at ${company}`,
			hint: "Look for alumni, past colleagues or shared connections",
			href: linkedin(company),
			source: "LinkedIn",
		},
		{
			icon: SearchIcon,
			label: `"${title}" "${company}" profiles`,
			hint: "Public LinkedIn profiles via Google, no sign-in needed",
			href: google(`site:linkedin.com/in "${title}" "${company}"`),
			source: "Google",
		},
	];

	return (
		<Card>
			<CardHeader>
				<CardTitle>People to reach out to</CardTitle>
				<CardDescription>
					A referral or a quick chat with someone on the team can beat a cold application.
				</CardDescription>
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
