import type { TKey } from "@/i18n/dictionaries";

import { ApiError } from "./api";

/** Error codes with their own copy in the dictionary (errors.<CODE>.title/.message). */
const KNOWN = [
	"INSUFFICIENT_CREDITS",
	"DAILY_TOKEN_LIMIT",
	"LLM_ERROR",
	"ANALYSIS_REQUIRED",
	"VALIDATION_ERROR",
	"FILE_TOO_LARGE",
	"INVALID_PDF",
	"EMPTY_EXTRACTION",
	"INVALID_CONTENT_TYPE",
	"CHECKOUT_FAILED",
	"BILLING_UNAVAILABLE",
	"NOT_FOUND",
	"UNAUTHORIZED",
	"NETWORK_ERROR",
	"SERVER",
	"CLIENT",
] as const;
export type ErrorCode = (typeof KNOWN)[number];

export interface FriendlyError {
	code: ErrorCode;
	/** Worth retrying: server-side (5xx), timeouts and network failures. Never 4xx. */
	retryable: boolean;
	/** Show a "Buy credits" call to action. */
	needsCredits?: boolean;
}

export function toFriendlyError(e: unknown): FriendlyError {
	if (!(e instanceof ApiError)) return { code: "NETWORK_ERROR", retryable: true };
	const retryable = e.status === 0 || e.status >= 500 || e.status === 408;
	const detail = typeof e.detail === "string" ? e.detail : undefined;
	if (detail === "INSUFFICIENT_CREDITS") return { code: detail, retryable: false, needsCredits: true };
	if (detail === "MISSING_FILE" || detail === "INVALID_FORM_DATA") return { code: "INVALID_PDF", retryable: false };
	if (detail && (KNOWN as readonly string[]).includes(detail)) return { code: detail as ErrorCode, retryable };
	return { code: retryable ? "SERVER" : "CLIENT", retryable };
}

/** Dictionary keys for an error's title and message (the store app can't point to buying credits). */
export function errorKeys(err: FriendlyError, storeApp = false): { title: TKey; message: TKey } {
	return {
		title: `errors.${err.code}.title` as TKey,
		message:
			storeApp && err.code === "INSUFFICIENT_CREDITS"
				? "errors.INSUFFICIENT_CREDITS.messageApp"
				: (`errors.${err.code}.message` as TKey),
	};
}
