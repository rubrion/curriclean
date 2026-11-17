import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Landing } from "@/components/landing/Landing";
import { auth } from "@/lib/auth";
import { landingMetadata } from "@/lib/seo";
import { inStoreApp } from "@/lib/storeApp";

export const metadata: Metadata = landingMetadata("pt");

export default async function HomePt() {
	// The landing sells credit packs, which the store app leaves to the web.
	if (await inStoreApp()) redirect("/dashboard");
	const session = await auth();
	return <Landing locale="pt" signedIn={Boolean(session)} />;
}
