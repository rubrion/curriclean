import "server-only";

import { headers } from "next/headers";

/**
 * True inside the Android app (curriclean-app/, a Capacitor shell around this
 * site), which appends "CurriCleanApp" to the web view's user agent. The app
 * sells nothing: Google Play only allows digital purchases through its own
 * billing, so credit top-ups stay on the web.
 */
export async function inStoreApp(): Promise<boolean> {
	return /\bCurriCleanApp\b/.test((await headers()).get("user-agent") ?? "");
}
