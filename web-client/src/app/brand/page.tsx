import { ArrowLeftIcon, CheckIcon, DownloadIcon, XIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { dictionaries, translate, type TKey } from "@/i18n/dictionaries";
import { getLocale } from "@/i18n/server";
import { SITE_URL } from "@/lib/site";
import { cn } from "@/lib/utils";

/** Preview background: light paper, dark charcoal, or brand red. */
type Surface = "light" | "dark" | "red";

const LOGOS: { label: TKey; file: string; size: string; surface: Surface }[] = [
	{ label: "brand.asset.icon", file: "/brand/curriclean-icon-512.png", size: "512 × 512", surface: "light" },
	{ label: "brand.asset.iconWhite", file: "/brand/curriclean-icon-white-512.png", size: "512 × 512", surface: "dark" },
	{ label: "brand.asset.mark", file: "/brand/curriclean-mark-1024.png", size: "1024 × 1024", surface: "light" },
	{ label: "brand.asset.markTight", file: "/brand/curriclean-mark-tight.png", size: "600 × 857", surface: "light" },
	{ label: "brand.asset.original", file: "/logo.png", size: "914 × 1306", surface: "dark" },
];

const ICONS: { file: string; size: string }[] = [
	{ file: "/android-chrome-512x512.png", size: "512 × 512" },
	{ file: "/android-chrome-192x192.png", size: "192 × 192" },
	{ file: "/apple-touch-icon.png", size: "180 × 180" },
	{ file: "/favicon-32x32.png", size: "32 × 32" },
	{ file: "/favicon-16x16.png", size: "16 × 16" },
	{ file: "/favicon.ico", size: "ICO" },
];

const COLORS: { label: TKey; hex: string }[] = [
	{ label: "brand.color.red", hex: "#C42524" },
	{ label: "brand.color.redDark", hex: "#E0504A" },
	{ label: "brand.color.cream", hex: "#FBF7F2" },
	{ label: "brand.color.ink", hex: "#2A2420" },
	{ label: "brand.color.charcoal", hex: "#1C1917" },
	{ label: "brand.color.sage", hex: "#5B8A6B" },
	{ label: "brand.color.amber", hex: "#C98A2B" },
	{ label: "brand.color.terracotta", hex: "#C0553B" },
	{ label: "brand.color.slate", hex: "#5B7290" },
];

const SURFACE: Record<Surface, string> = {
	light: "bg-[#fbf7f2] bg-[radial-gradient(#e7ddd1_1px,transparent_1px)] [background-size:14px_14px]",
	dark: "bg-[#1c1917]",
	red: "bg-[#c42524]",
};

const fileName = (path: string) => path.split("/").pop() ?? path;

export async function generateMetadata(): Promise<Metadata> {
	const locale = await getLocale();
	const t = (key: TKey) => translate(dictionaries[locale], key);
	return {
		title: t("brand.metaTitle"),
		description: t("brand.metaDesc"),
		alternates: { canonical: `${SITE_URL}/brand` },
	};
}

/** Public brand kit: logos, app icons, colors and usage, outside the app shell. */
export default async function BrandPage() {
	const locale = await getLocale();
	const t = (key: TKey) => translate(dictionaries[locale], key);
	const home = locale === "pt" ? "/pt" : "/";

	return (
		<div className="min-h-svh bg-background">
			<header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
				<Link href={home}>
					<Logo />
				</Link>
				<ThemeToggle />
			</header>

			<main className="mx-auto flex max-w-5xl flex-col gap-14 px-4 pb-20 pt-6 sm:px-6">
				<div className="flex flex-col gap-3">
					<Button asChild variant="ghost" size="sm" className="self-start text-muted-foreground">
						<Link href={home}>
							<ArrowLeftIcon />
							{t("brand.back")}
						</Link>
					</Button>
					<h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("brand.title")}</h1>
					<p className="max-w-2xl text-muted-foreground">{t("brand.subtitle")}</p>
				</div>

				<Section title={t("brand.logos")} desc={t("brand.logosDesc")}>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{LOGOS.map((l) => (
							<AssetCard
								key={l.file}
								label={t(l.label)}
								file={l.file}
								size={l.size}
								surface={l.surface}
								download={t("brand.download")}
							/>
						))}
					</div>
				</Section>

				<Section title={t("brand.icons")} desc={t("brand.iconsDesc")}>
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
						{ICONS.map((i) => (
							<a
								key={i.file}
								href={i.file}
								download
								className="group flex flex-col items-center gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-soft"
							>
								<span className="flex size-16 items-center justify-center">
									<Image src={i.file} alt="" width={64} height={64} unoptimized className="max-h-16 w-auto" />
								</span>
								<span className="w-full min-w-0 text-center">
									<span className="block break-all font-mono text-[11px] leading-tight">{fileName(i.file)}</span>
									<span className="block text-xs text-muted-foreground">{i.size}</span>
								</span>
								<DownloadIcon className="size-4 text-muted-foreground group-hover:text-primary" />
							</a>
						))}
					</div>
				</Section>

				<Section title={t("brand.colors")} desc={t("brand.colorsDesc")}>
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
						{COLORS.map((c) => (
							<div key={c.hex} className="overflow-hidden rounded-xl border bg-card">
								<div className="h-20 border-b" style={{ backgroundColor: c.hex }} />
								<div className="flex flex-col gap-0.5 p-3">
									<span className="text-sm font-medium">{t(c.label)}</span>
									<span className="select-all font-mono text-xs text-muted-foreground">{c.hex}</span>
								</div>
							</div>
						))}
					</div>
				</Section>

				<div className="grid gap-10 md:grid-cols-2">
					<Section title={t("brand.type")} desc={t("brand.typeDesc")}>
						<div className="flex flex-col gap-3 rounded-xl border bg-card p-5">
							<span className="text-4xl font-semibold tracking-tight">Geist Aa</span>
							<span className="text-muted-foreground">
								Curri<span className="text-primary">Clean</span> · ABCDEFGHIJ abcdefghij
							</span>
							<span className="font-mono text-sm text-muted-foreground">Geist Mono 0123456789 · 98%</span>
						</div>
					</Section>

					<Section title={t("brand.usage")}>
						<ul className="flex flex-col gap-3 rounded-xl border bg-card p-5 text-sm">
							{(["brand.do1", "brand.do2"] as TKey[]).map((k) => (
								<li key={k} className="flex gap-2.5">
									<CheckIcon className="mt-0.5 size-4 shrink-0 text-success" />
									{t(k)}
								</li>
							))}
							{(["brand.dont1", "brand.dont2"] as TKey[]).map((k) => (
								<li key={k} className="flex gap-2.5">
									<XIcon className="mt-0.5 size-4 shrink-0 text-danger" />
									{t(k)}
								</li>
							))}
						</ul>
					</Section>
				</div>
			</main>
		</div>
	);
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
	return (
		<section className="flex flex-col gap-4">
			<div className="flex flex-col gap-1">
				<h2 className="text-xl font-semibold tracking-tight">{title}</h2>
				{desc && <p className="text-sm text-muted-foreground">{desc}</p>}
			</div>
			{children}
		</section>
	);
}

function AssetCard({
	label,
	file,
	size,
	surface,
	download,
}: {
	label: string;
	file: string;
	size: string;
	surface: Surface;
	download: string;
}) {
	return (
		<div className="flex flex-col overflow-hidden rounded-xl border bg-card">
			<div className={cn("flex h-44 items-center justify-center p-6", SURFACE[surface])}>
				<Image src={file} alt={label} width={160} height={160} unoptimized className="max-h-32 w-auto object-contain" />
			</div>
			<div className="flex items-center justify-between gap-3 border-t p-3">
				<div className="min-w-0">
					<div className="truncate text-sm font-medium">{label}</div>
					<div className="truncate font-mono text-xs text-muted-foreground">
						{fileName(file)} · {size}
					</div>
				</div>
				<Button asChild size="sm" variant="outline">
					<a href={file} download>
						<DownloadIcon />
						{download}
					</a>
				</Button>
			</div>
		</div>
	);
}
