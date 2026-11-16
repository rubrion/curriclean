import type { TKey } from "@/i18n/dictionaries";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function post(path: string, body: unknown): Promise<void> {
	const res = await fetch(`${API_URL}${path}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	if (!res.ok) {
		let detail: string | undefined;
		try {
			const data = (await res.json()) as { detail?: unknown };
			if (typeof data.detail === "string") detail = data.detail;
		} catch {
			detail = await res.text().catch(() => undefined);
		}
		const err = new Error(detail ?? `${res.status} ${res.statusText}`);
		(err as Error & { status?: number }).status = res.status;
		throw err;
	}
}

const AUTH_CODES = [
	"INVALID_OR_EXPIRED_TOKEN",
	"VALIDATION_ERROR",
	"USER_NOT_FOUND",
	"INVALID_CREDENTIALS",
	"EMAIL_NOT_VERIFIED",
] as const;

/** Dictionary key for an auth API error, so pages can show it in the user's language. */
export function authErrorKey(e: unknown): TKey {
	const code = e instanceof Error ? e.message : "";
	return (AUTH_CODES as readonly string[]).includes(code) ? (`auth.err.${code}` as TKey) : "auth.err.GENERIC";
}

export const authApi = {
	register: (email: string, password: string, name?: string) =>
		post("/auth/register", { email, password, name }),
	verify: (token: string) => post("/auth/verify", { token }),
	forgot: (email: string) => post("/auth/forgot", { email }),
	reset: (token: string, password: string) =>
		post("/auth/reset", { token, password }),
};
