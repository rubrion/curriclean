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

const AUTH_MESSAGES: Record<string, string> = {
	INVALID_OR_EXPIRED_TOKEN: "This link is invalid or has expired. Request a new one.",
	VALIDATION_ERROR: "Please check your details. Passwords need at least 8 characters.",
	USER_NOT_FOUND: "We couldn't find that account.",
	INVALID_CREDENTIALS: "That email and password don't match.",
	EMAIL_NOT_VERIFIED: "Please verify your email first — check your inbox.",
};

/** Turn an auth API error into a sentence people can act on. */
export function authErrorMessage(e: unknown): string {
	const code = e instanceof Error ? e.message : "";
	return AUTH_MESSAGES[code] ?? "Something went wrong. Please try again.";
}

export const authApi = {
	register: (email: string, password: string, name?: string) =>
		post("/auth/register", { email, password, name }),
	verify: (token: string) => post("/auth/verify", { token }),
	forgot: (email: string) => post("/auth/forgot", { email }),
	reset: (token: string, password: string) =>
		post("/auth/reset", { token, password }),
};
