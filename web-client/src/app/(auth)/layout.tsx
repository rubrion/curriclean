import { CheckCircle2Icon } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getT } from "@/i18n/server";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
	const t = await getT();
	const points = [t("auth.point1"), t("auth.point2"), t("auth.point3"), t("auth.point4")];
	return (
		<div className="grid min-h-svh lg:grid-cols-2">
			<div className="flex flex-col px-6 py-6 sm:px-10">
				<div className="flex items-center justify-between">
					<Link href="/">
						<Logo />
					</Link>
					<div className="flex items-center gap-1">
						<LanguageSwitcher />
						<ThemeToggle />
					</div>
				</div>
				<main className="flex flex-1 items-center justify-center py-10">
					<div className="w-full max-w-sm">{children}</div>
				</main>
				<p className="text-center text-xs text-muted-foreground">{t("auth.footer")}</p>
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
					<h2 className="text-3xl font-semibold tracking-tight text-balance">{t("auth.headline")}</h2>
					<ul className="flex flex-col gap-3">
						{points.map((p) => (
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
