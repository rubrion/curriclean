import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: "*",
				allow: ["/", "/pt"],
				disallow: ["/api/", "/dashboard", "/applications", "/billing", "/verify", "/reset", "/forgot"],
			},
		],
		sitemap: `${SITE_URL}/sitemap.xml`,
		host: SITE_URL,
	};
}
