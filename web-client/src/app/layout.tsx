import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Providers } from "@/components/Providers";
import { getLocale } from "@/i18n/server";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title: { default: "CurriClean", template: "%s · CurriClean" },
	description: "AI CV match score, tailored CV suggestions and a simple job application tracker.",
	applicationName: "CurriClean",
	icons: {
		icon: [
			{ url: "/favicon.ico", sizes: "any" },
			{ url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
			{ url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
		],
		apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
	},
	manifest: "/site.webmanifest",
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const locale = await getLocale();
	return (
		<html lang={locale === "pt" ? "pt-BR" : "en"} suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
			<body className="antialiased">
				<Providers locale={locale}>{children}</Providers>
			</body>
		</html>
	);
}
