import { redirect } from "next/navigation";

import { Header } from "@/components/Header";
import { auth } from "@/lib/auth";

export default async function ApplicationsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();
	if (!session) redirect("/login");

	return (
		<div className="min-h-screen">
			<Header />
			<main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
		</div>
	);
}
