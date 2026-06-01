import { ProfileHit } from "../types";

const BRAVE_SEARCH_URL = "https://api.search.brave.com/res/v1/web/search";

interface BraveWebResult {
  url: string;
  title: string;
  description?: string;
}

interface BraveSearchResponse {
  web?: { results?: BraveWebResult[] };
}

export async function searchLinkedInProfiles(
  apiKey: string,
  jobTitle: string,
  company: string,
  limit: number
): Promise<ProfileHit[]> {
  const query = `site:linkedin.com/in "${jobTitle}" "${company}"`;
  const url = new URL(BRAVE_SEARCH_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("count", String(Math.min(limit, 20)));

  const resp = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip",
      "X-Subscription-Token": apiKey,
    },
  });

  if (!resp.ok) {
    throw new BraveError(`Brave Search returned ${resp.status}`);
  }

  const data = (await resp.json()) as BraveSearchResponse;
  const results = data.web?.results ?? [];

  return results.map((r) => ({
    url: r.url,
    title: r.title,
    description: r.description ?? "",
  }));
}

export class BraveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BraveError";
  }
}
