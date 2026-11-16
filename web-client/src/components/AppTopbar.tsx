"use client";

import { CoinsIcon } from "lucide-react";
import Link from "next/link";

import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useBilling } from "@/lib/billing";

export function AppTopbar() {
	const { billing } = useBilling();
	return (
		<header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 rounded-t-xl bg-background/80 px-4 backdrop-blur sm:px-6">
			<SidebarTrigger className="-ml-1" />
			<Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
			<div className="flex-1" />
			{billing && (
				<Button asChild variant="outline" size="sm" className="gap-1.5 rounded-full">
					<Link href="/billing">
						<CoinsIcon className="text-primary" />
						<span className="tabular-nums">{billing.credits}</span>
						<span className="hidden text-muted-foreground sm:inline">credits</span>
					</Link>
				</Button>
			)}
			<ThemeToggle />
		</header>
	);
}
