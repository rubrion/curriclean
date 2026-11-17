import {
	ArrowRightIcon,
	CheckIcon,
	ChevronDownIcon,
	ClipboardListIcon,
	FileTextIcon,
	GaugeIcon,
	KanbanSquareIcon,
	MessageCircleQuestionIcon,
	SparklesIcon,
	UsersIcon,
	WandSparklesIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { LandingLangLink } from "@/components/landing/LandingLangLink";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Locale } from "@/i18n/config";
import { dictionaries, translate, type TKey } from "@/i18n/dictionaries";
import { GITHUB_URL, LANDING_PATH, SITE_NAME, SITE_URL } from "@/lib/site";

const FEATURES: { icon: typeof GaugeIcon; title: TKey; desc: TKey }[] = [
	{ icon: GaugeIcon, title: "landing.f1.title", desc: "landing.f1.desc" },
	{ icon: ClipboardListIcon, title: "landing.f2.title", desc: "landing.f2.desc" },
	{ icon: WandSparklesIcon, title: "landing.f3.title", desc: "landing.f3.desc" },
	{ icon: MessageCircleQuestionIcon, title: "landing.f4.title", desc: "landing.f4.desc" },
	{ icon: KanbanSquareIcon, title: "landing.f5.title", desc: "landing.f5.desc" },
	{ icon: UsersIcon, title: "landing.f6.title", desc: "landing.f6.desc" },
];

const STEPS: { icon: typeof GaugeIcon; title: TKey; desc: TKey }[] = [
	{ icon: ClipboardListIcon, title: "landing.how.s1.title", desc: "landing.how.s1.desc" },
	{ icon: FileTextIcon, title: "landing.how.s2.title", desc: "landing.how.s2.desc" },
	{ icon: SparklesIcon, title: "landing.how.s3.title", desc: "landing.how.s3.desc" },
];

const FAQ: [TKey, TKey][] = [
	["landing.faq.q1", "landing.faq.a1"],
	["landing.faq.q2", "landing.faq.a2"],
	["landing.faq.q3", "landing.faq.a3"],
	["landing.faq.q4", "landing.faq.a4"],
	["landing.faq.q5", "landing.faq.a5"],
];

/** Public landing page, rendered on the server in one language. */
export function Landing({ locale, signedIn }: { locale: Locale; signedIn: boolean }) {
	const t = (key: TKey, vars?: Record<string, string | number>) => translate(dictionaries[locale], key, vars);
	const other: Locale = locale === "pt" ? "en" : "pt";
	const startHref = signedIn ? "/dashboard" : "/register";

	const jsonLd = [
		{
			"@context": "https://schema.org",
			"@type": "SoftwareApplication",
			name: SITE_NAME,
			url: `${SITE_URL}${LANDING_PATH[locale]}`,
			applicationCategory: "BusinessApplication",
			operatingSystem: "Web",
			inLanguage: locale === "pt" ? "pt-BR" : "en",
			description: t("seo.description"),
			offers: [
				{ "@type": "Offer", price: "0", priceCurrency: "USD", description: t("landing.pricing.freeDesc") },
				{ "@type": "Offer", price: "5", priceCurrency: "USD", description: t("landing.pricing.packsDesc") },
			],
			publisher: { "@type": "Organization", name: "Rubrion", url: "https://rubrion.ai" },
		},
		{
			"@context": "https://schema.org",
			"@type": "FAQPage",
			inLanguage: locale === "pt" ? "pt-BR" : "en",
			mainEntity: FAQ.map(([q, a]) => ({
				"@type": "Question",
				name: t(q),
				acceptedAnswer: { "@type": "Answer", text: t(a) },
			})),
		},
	];

	return (
		<div className="min-h-svh bg-background">
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

			<header className="sticky top-0 z-20 border-b border-transparent bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
				<div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
					<Link href={LANDING_PATH[locale]} aria-label={SITE_NAME}>
						<Logo />
					</Link>
					<nav className="hidden items-center gap-5 text-sm text-muted-foreground md:flex">
						<a href="#features" className="hover:text-foreground">
							{t("landing.nav.features")}
						</a>
						<a href="#pricing" className="hover:text-foreground">
							{t("landing.nav.pricing")}
						</a>
						<a href="#faq" className="hover:text-foreground">
							{t("landing.nav.faq")}
						</a>
					</nav>
					<div className="ml-auto flex items-center gap-1 sm:gap-2">
						<Button asChild variant="ghost" size="sm" className="px-2 text-xs font-semibold">
							<LandingLangLink locale={other}>{other === "pt" ? "PT" : "EN"}</LandingLangLink>
						</Button>
						<ThemeToggle />
						{!signedIn && (
							<Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
								<Link href="/login">{t("landing.nav.signIn")}</Link>
							</Button>
						)}
						<Button asChild size="sm">
							<Link href={startHref}>{signedIn ? t("landing.nav.dashboard") : t("landing.nav.getStarted")}</Link>
						</Button>
					</div>
				</div>
			</header>

			<main>
				{/* Hero */}
				<section className="relative overflow-hidden">
					<div aria-hidden className="absolute -top-40 right-0 size-[36rem] rounded-full bg-primary/10 blur-3xl" />
					<div aria-hidden className="absolute top-60 -left-40 size-[30rem] rounded-full bg-warning/15 blur-3xl" />
					<div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pt-16 pb-12 text-center sm:px-6 sm:pt-24">
						<Badge variant="secondary" className="mb-6 gap-1.5 rounded-full px-3 py-1">
							<SparklesIcon className="size-3.5 text-primary" />
							{t("landing.badge")}
						</Badge>
						<h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
							{t("landing.title")}
						</h1>
						<p className="mt-6 max-w-2xl text-lg text-pretty text-muted-foreground">{t("landing.subtitle")}</p>
						<div className="mt-8 flex flex-col gap-3 sm:flex-row">
							<Button asChild size="lg" className="h-11 px-6 text-base">
								<Link href={startHref}>
									{signedIn ? t("landing.nav.dashboard") : t("landing.ctaPrimary")}
									<ArrowRightIcon />
								</Link>
							</Button>
							<Button asChild size="lg" variant="outline" className="h-11 px-6 text-base">
								<a href="#how">{t("landing.ctaSecondary")}</a>
							</Button>
						</div>
						<p className="mt-4 text-sm text-muted-foreground">{t("landing.trust")}</p>

						<div className="mt-14 w-full max-w-5xl rounded-2xl border bg-card p-2 shadow-soft">
							<Image
								src={`/screenshots/dashboard-${locale}.png`}
								alt={t("landing.screenshotAlt")}
								width={2400}
								height={1500}
								priority
								className="h-auto w-full rounded-xl"
							/>
						</div>
					</div>
				</section>

				{/* Features */}
				<section id="features" className="scroll-mt-20 py-20">
					<div className="mx-auto max-w-6xl px-4 sm:px-6">
						<SectionHeading title={t("landing.features.title")} subtitle={t("landing.features.subtitle")} />
						<div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{FEATURES.map((f) => (
								<Card key={f.title} className="h-full">
									<CardHeader>
										<span className="mb-2 flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
											<f.icon className="size-5" />
										</span>
										<CardTitle className="text-base">
											<h3>{t(f.title)}</h3>
										</CardTitle>
										<CardDescription className="leading-relaxed">{t(f.desc)}</CardDescription>
									</CardHeader>
								</Card>
							))}
						</div>
					</div>
				</section>

				{/* How it works */}
				<section id="how" className="scroll-mt-20 bg-sidebar py-20">
					<div className="mx-auto max-w-6xl px-4 sm:px-6">
						<SectionHeading title={t("landing.how.title")} />
						<ol className="mt-12 grid gap-6 md:grid-cols-3">
							{STEPS.map((s, i) => (
								<li key={s.title} className="flex flex-col items-center text-center">
									<span className="relative flex size-14 items-center justify-center rounded-2xl bg-card text-primary shadow-soft">
										<s.icon className="size-6" />
										<span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
											{i + 1}
										</span>
									</span>
									<h3 className="mt-5 text-lg font-semibold">{t(s.title)}</h3>
									<p className="mt-2 max-w-xs text-muted-foreground">{t(s.desc)}</p>
								</li>
							))}
						</ol>
					</div>
				</section>

				{/* Pricing */}
				<section id="pricing" className="scroll-mt-20 py-20">
					<div className="mx-auto max-w-4xl px-4 sm:px-6">
						<SectionHeading title={t("landing.pricing.title")} subtitle={t("landing.pricing.subtitle")} />
						<div className="mt-12 grid gap-4 md:grid-cols-2">
							<PriceCard
								title={t("landing.pricing.freeTitle")}
								price={t("landing.pricing.freePrice")}
								desc={t("landing.pricing.freeDesc")}
								items={[t("landing.pricing.free1"), t("landing.pricing.free2"), t("landing.pricing.free3")]}
								cta={signedIn ? t("landing.nav.dashboard") : t("landing.ctaPrimary")}
								href={startHref}
								featured
							/>
							<PriceCard
								title={t("landing.pricing.packsTitle")}
								price={t("landing.pricing.packsPrice")}
								desc={t("landing.pricing.packsDesc")}
								items={[t("landing.pricing.packs1"), t("landing.pricing.packs2"), t("landing.pricing.packs3")]}
								cta={signedIn ? t("landing.nav.dashboard") : t("landing.nav.getStarted")}
								href={signedIn ? "/billing" : "/register"}
							/>
						</div>
					</div>
				</section>

				{/* FAQ */}
				<section id="faq" className="scroll-mt-20 bg-sidebar py-20">
					<div className="mx-auto max-w-3xl px-4 sm:px-6">
						<SectionHeading title={t("landing.faq.title")} />
						<div className="mt-10 flex flex-col gap-3">
							{FAQ.map(([q, a]) => (
								<details key={q} className="group rounded-xl border bg-card px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
									<summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
										<h3>{t(q)}</h3>
										<ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
									</summary>
									<p className="mt-3 leading-relaxed text-muted-foreground">{t(a)}</p>
								</details>
							))}
						</div>
					</div>
				</section>

				{/* Final CTA */}
				<section className="py-20">
					<div className="mx-auto max-w-4xl px-4 sm:px-6">
						<div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12">
							<div aria-hidden className="absolute -top-20 -right-20 size-72 rounded-full bg-white/10 blur-2xl" />
							<span aria-hidden className="mx-auto mb-6 block h-12 w-9 bg-primary-foreground [mask-image:url(/logo.png)] [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]" />
							<h2 className="text-3xl font-semibold tracking-tight text-balance">{t("landing.cta.title")}</h2>
							<p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">{t("landing.cta.subtitle")}</p>
							<Button asChild size="lg" variant="secondary" className="mt-8 h-11 px-6 text-base">
								<Link href={startHref}>
									{signedIn ? t("landing.nav.dashboard") : t("landing.ctaPrimary")}
									<ArrowRightIcon />
								</Link>
							</Button>
						</div>
					</div>
				</section>
			</main>

			<footer className="border-t">
				<div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
					<div className="flex items-center gap-3">
						<Logo markClassName="h-5" className="[&>span:nth-child(2)]:text-base" />
						<span>{t("landing.footer.rights", { year: new Date().getFullYear() })}</span>
					</div>
					<div className="flex items-center gap-4">
						<LandingLangLink locale="en" className="hover:text-foreground">
							English
						</LandingLangLink>
						<LandingLangLink locale="pt" className="hover:text-foreground">
							Português
						</LandingLangLink>
						<Link href="/privacy" className="hover:text-foreground">
							{t("legal.privacy")}
						</Link>
						<Link href="/brand" className="hover:text-foreground">
							{t("landing.footer.brand")}
						</Link>
						<a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
							{t("landing.footer.opensource")}
						</a>
					</div>
				</div>
			</footer>
		</div>
	);
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
	return (
		<div className="mx-auto max-w-2xl text-center">
			<h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h2>
			{subtitle && <p className="mt-4 text-lg text-muted-foreground">{subtitle}</p>}
		</div>
	);
}

function PriceCard({
	title,
	price,
	desc,
	items,
	cta,
	href,
	featured,
}: {
	title: string;
	price: string;
	desc: string;
	items: string[];
	cta: string;
	href: string;
	featured?: boolean;
}) {
	return (
		<Card className={featured ? "ring-2 ring-primary/60 shadow-soft" : undefined}>
			<CardHeader>
				<CardDescription className="font-medium text-foreground">
					<h3>{title}</h3>
				</CardDescription>
				<CardTitle className="text-4xl tabular-nums">{price}</CardTitle>
				<CardDescription>{desc}</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-5">
				<ul className="flex flex-col gap-2.5 text-sm">
					{items.map((i) => (
						<li key={i} className="flex gap-2.5">
							<CheckIcon className="mt-0.5 size-4 shrink-0 text-success" />
							{i}
						</li>
					))}
				</ul>
				<Button asChild variant={featured ? "default" : "outline"} className="w-full">
					<Link href={href}>{cta}</Link>
				</Button>
			</CardContent>
		</Card>
	);
}
