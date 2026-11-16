"use client";

import { CheckIcon, LanguagesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/i18n/client";
import type { Locale } from "@/i18n/config";

const OPTIONS: { value: Locale; label: string; short: string }[] = [
	{ value: "en", label: "English", short: "EN" },
	{ value: "pt", label: "Português (Brasil)", short: "PT" },
];

export function LanguageSwitcher() {
	const { locale, setLocale, t } = useI18n();
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="sm" aria-label={t("lang.label")} className="gap-1.5 px-2">
					<LanguagesIcon />
					<span className="text-xs font-semibold">{OPTIONS.find((o) => o.value === locale)?.short}</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuLabel className="font-normal text-muted-foreground">{t("lang.label")}</DropdownMenuLabel>
				{OPTIONS.map((o) => (
					<DropdownMenuItem key={o.value} onClick={() => setLocale(o.value)}>
						<CheckIcon className={o.value === locale ? "opacity-100" : "opacity-0"} />
						{o.label}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
