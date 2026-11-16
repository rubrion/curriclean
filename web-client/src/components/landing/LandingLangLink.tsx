"use client";

import { LOCALE_COOKIE, type Locale } from "@/i18n/config";
import { LANDING_PATH } from "@/lib/site";

/**
 * A plain link to the other language's landing page (crawlable), that also
 * saves the choice so the app and later visits use that language.
 */
export function LandingLangLink({
	locale,
	className,
	children,
	...rest
}: { locale: Locale; className?: string; children: React.ReactNode } & React.ComponentProps<"a">) {
	return (
		<a
			{...rest}
			href={LANDING_PATH[locale]}
			hrefLang={locale === "pt" ? "pt-BR" : "en"}
			lang={locale === "pt" ? "pt-BR" : "en"}
			className={className}
			onClick={() => {
				document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
			}}
		>
			{children}
		</a>
	);
}
