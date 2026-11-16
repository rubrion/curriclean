import type { Metadata } from "next";

import { Landing } from "@/components/landing/Landing";
import { auth } from "@/lib/auth";
import { landingMetadata } from "@/lib/seo";

export const metadata: Metadata = landingMetadata("pt");

export default async function HomePt() {
	const session = await auth();
	return <Landing locale="pt" signedIn={Boolean(session)} />;
}
