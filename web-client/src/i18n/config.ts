export const LOCALES = ["en", "pt"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "locale";

/** BCP 47 tag for Intl date/number formatting. */
export const INTL_LOCALE: Record<Locale, string> = { en: "en-US", pt: "pt-BR" };

export function isLocale(v: unknown): v is Locale {
	return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

/** Pick a locale from an Accept-Language header: any Portuguese variant → pt. */
export function localeFromAcceptLanguage(header: string | null): Locale {
	if (!header) return DEFAULT_LOCALE;
	for (const part of header.split(",")) {
		const tag = part.split(";")[0].trim().toLowerCase();
		if (tag.startsWith("pt")) return "pt";
		if (tag.startsWith("en")) return "en";
	}
	return DEFAULT_LOCALE;
}
