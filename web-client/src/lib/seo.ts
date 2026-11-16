import type { Metadata } from "next";

import type { Locale } from "@/i18n/config";
import { dictionaries } from "@/i18n/dictionaries";

import { LANDING_PATH, SITE_NAME } from "./site";

/** Title, description, canonical, hreflang and social cards for a landing page. */
export function landingMetadata(locale: Locale): Metadata {
	const d = dictionaries[locale];
	return {
		title: { absolute: d["seo.title"] },
		description: d["seo.description"],
		alternates: {
			canonical: LANDING_PATH[locale],
			languages: { en: LANDING_PATH.en, "pt-BR": LANDING_PATH.pt, "x-default": LANDING_PATH.en },
		},
		openGraph: {
			type: "website",
			siteName: SITE_NAME,
			url: LANDING_PATH[locale],
			title: d["seo.title"],
			description: d["seo.description"],
			locale: locale === "pt" ? "pt_BR" : "en_US",
			alternateLocale: locale === "pt" ? ["en_US"] : ["pt_BR"],
			images: [{ url: `/og-${locale}.png`, width: 1200, height: 630, alt: d["seo.title"] }],
		},
		twitter: {
			card: "summary_large_image",
			title: d["seo.title"],
			description: d["seo.description"],
			images: [`/og-${locale}.png`],
		},
	};
}
