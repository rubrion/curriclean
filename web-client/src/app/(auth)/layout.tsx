import { CheckCircle2Icon } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

const POINTS = [
	"Score your CV against any job description in seconds",
	"See your strengths, gaps and likely interview questions",
	"Get bullet points rewritten in the job's language",
	"Track every application on a simple pipeline board",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="grid min-h-svh lg:grid-cols-2">
			<div className="flex flex-col px-6 py-6 sm:px-10">
				<div className="flex items-center justify-between">
					<Link href="/">
						<Logo />
					</Link>
					<ThemeToggle />
				</div>
				<main className="flex flex-1 items-center justify-center py-10">
					<div className="w-full max-w-sm">{children}</div>
				</main>
				<p className="text-center text-xs text-muted-foreground">
					Open source · Your CV is never stored
				</p>
			</div>

			<aside className="relative hidden overflow-hidden bg-sidebar lg:flex lg:flex-col lg:justify-center lg:px-16">
				<div
					aria-hidden
					className="absolute -top-32 -right-32 size-[28rem] rounded-full bg-primary/10 blur-3xl"
				/>
				<div
					aria-hidden
					className="absolute -bottom-40 -left-20 size-[26rem] rounded-full bg-warning/15 blur-3xl"
				/>
				<div className="relative flex max-w-md flex-col gap-8">
					<span aria-hidden className="logo-mark block h-16" />
					<h2 className="text-3xl font-semibold tracking-tight text-balance">
						Land the right job with a CV that fits it.
					</h2>
					<ul className="flex flex-col gap-3">
						{POINTS.map((p) => (
							<li key={p} className="flex gap-3 text-sm text-foreground/80">
								<CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-success" />
								{p}
							</li>
						))}
					</ul>
				</div>
			</aside>
		</div>
	);
}
