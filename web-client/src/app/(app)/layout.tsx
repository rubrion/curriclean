import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AppSidebar } from "@/components/AppSidebar";
import { AppTopbar } from "@/components/AppTopbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import { BillingProvider } from "@/lib/billing";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
	const session = await auth();
	if (!session) redirect("/login");

	return (
		<BillingProvider>
			<SidebarProvider>
				<Suspense>
					<AppSidebar />
				</Suspense>
				<SidebarInset>
					<AppTopbar />
					<main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-12 pt-2 sm:px-6 lg:px-8">
						{children}
					</main>
				</SidebarInset>
			</SidebarProvider>
		</BillingProvider>
	);
}
