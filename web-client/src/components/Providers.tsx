"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/i18n/client";
import type { Locale } from "@/i18n/config";
import { StoreAppProvider } from "@/lib/storeAppContext";

export function Providers({
	locale,
	storeApp,
	children,
}: {
	locale: Locale;
	storeApp: boolean;
	children: React.ReactNode;
}) {
	return (
		<StoreAppProvider value={storeApp}>
			<SessionProvider>
				<I18nProvider locale={locale}>
					<ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
						<TooltipProvider delayDuration={200}>
							{children}
							<Toaster position="bottom-right" richColors closeButton />
						</TooltipProvider>
					</ThemeProvider>
				</I18nProvider>
			</SessionProvider>
		</StoreAppProvider>
	);
}
