import "server-only";

import { cookies, headers } from "next/headers";

import { isLocale, type Locale, LOCALE_COOKIE, localeFromAcceptLanguage } from "./config";
import { dictionaries, translate, type TKey } from "./dictionaries";

/** The visitor's locale: their saved choice, else their browser's language. */
export async function getLocale(): Promise<Locale> {
	const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
	if (isLocale(saved)) return saved;
	return localeFromAcceptLanguage((await headers()).get("accept-language"));
}

/** Translator for server components. */
export async function getT() {
	const locale = await getLocale();
	return (key: TKey, vars?: Record<string, string | number>) => translate(dictionaries[locale], key, vars);
}
