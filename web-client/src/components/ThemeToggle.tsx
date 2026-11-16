"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";

export function ThemeToggle() {
	const { resolvedTheme, setTheme } = useTheme();
	const { t } = useI18n();
	const dark = resolvedTheme === "dark";
	return (
		<Button
			variant="ghost"
			size="icon"
			aria-label={t("theme.toggle")}
			onClick={() => setTheme(dark ? "light" : "dark")}
		>
			<SunIcon className="hidden dark:block" />
			<MoonIcon className="dark:hidden" />
		</Button>
	);
}
