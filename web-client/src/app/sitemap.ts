import type { MetadataRoute } from "next";

import { LANDING_PATH, SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
	const languages = { en: `${SITE_URL}${LANDING_PATH.en}`, "pt-BR": `${SITE_URL}${LANDING_PATH.pt}` };
	const lastModified = new Date();
	return [
		{ url: `${SITE_URL}${LANDING_PATH.en}`, lastModified, changeFrequency: "monthly", priority: 1, alternates: { languages } },
		{ url: `${SITE_URL}${LANDING_PATH.pt}`, lastModified, changeFrequency: "monthly", priority: 1, alternates: { languages } },
		{ url: `${SITE_URL}/register`, lastModified, changeFrequency: "yearly", priority: 0.5 },
		{ url: `${SITE_URL}/login`, lastModified, changeFrequency: "yearly", priority: 0.3 },
	];
}
