import Link from "next/link";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getT } from "@/i18n/server";

/** Simple public page frame for the privacy policy and account deletion. */
export async function LegalShell({ children }: { children: React.ReactNode }) {
	const t = await getT();
	return (
		<div className="min-h-svh">
			<header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-6 sm:px-6">
				<Link href="/">
					<Logo />
				</Link>
				<div className="flex items-center gap-1">
					<LanguageSwitcher />
					<ThemeToggle />
				</div>
			</header>
			<main className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">{children}</main>
			<footer className="mx-auto flex max-w-3xl gap-4 px-4 pb-10 text-sm text-muted-foreground sm:px-6">
				<Link href="/privacy" className="hover:text-foreground">
					{t("legal.privacy")}
				</Link>
				<Link href="/delete-account" className="hover:text-foreground">
					{t("legal.deleteAccount")}
				</Link>
			</footer>
		</div>
	);
}
