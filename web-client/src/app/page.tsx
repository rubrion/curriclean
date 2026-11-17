import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { Landing } from "@/components/landing/Landing";
import { isLocale, LOCALE_COOKIE, localeFromAcceptLanguage } from "@/i18n/config";
import { auth } from "@/lib/auth";
import { landingMetadata } from "@/lib/seo";
import { inStoreApp } from "@/lib/storeApp";

export const metadata: Metadata = landingMetadata("en");

export default async function Home() {
	// The landing sells credit packs, which the store app leaves to the web.
	if (await inStoreApp()) redirect("/dashboard");
	// People who chose Portuguese (or whose browser prefers it) get /pt.
	// Crawlers send neither, so they index the English page here.
	const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
	const preferred = isLocale(saved) ? saved : localeFromAcceptLanguage((await headers()).get("accept-language"));
	if (preferred === "pt") redirect("/pt");

	const session = await auth();
	return <Landing locale="en" signedIn={Boolean(session)} />;
}
