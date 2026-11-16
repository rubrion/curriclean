"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo } from "react";

import { INTL_LOCALE, type Locale, LOCALE_COOKIE } from "./config";
import { dictionaries, translate, type TKey } from "./dictionaries";

type I18n = {
	locale: Locale;
	/** BCP 47 tag for dates and numbers. */
	intl: string;
	t: (key: TKey, vars?: Record<string, string | number>) => string;
	setLocale: (l: Locale) => void;
};

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
	const router = useRouter();
	const setLocale = useCallback(
		(l: Locale) => {
			document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
			document.documentElement.lang = l === "pt" ? "pt-BR" : "en";
			router.refresh();
		},
		[router],
	);
	const value = useMemo<I18n>(
		() => ({
			locale,
			intl: INTL_LOCALE[locale],
			t: (key, vars) => translate(dictionaries[locale], key, vars),
			setLocale,
		}),
		[locale, setLocale],
	);
	return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
	const ctx = useContext(I18nContext);
	if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
	return ctx;
}
