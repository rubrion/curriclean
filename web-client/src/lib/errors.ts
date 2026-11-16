import { ApiError } from "./api";

export interface FriendlyError {
	title: string;
	message: string;
	/** Worth retrying: server-side (5xx), timeouts and network failures. Never 4xx. */
	retryable: boolean;
	/** Show a "Buy credits" call to action. */
	needsCredits?: boolean;
}

const BY_CODE: Record<string, Omit<FriendlyError, "retryable">> = {
	INSUFFICIENT_CREDITS: {
		title: "You're out of credits",
		message: "Today's free runs are used up. Top up your credits to keep going, or come back tomorrow.",
		needsCredits: true,
	},
	DAILY_TOKEN_LIMIT: {
		title: "Daily limit reached",
		message: "You've hit today's usage limit. It resets at midnight UTC.",
	},
	LLM_ERROR: {
		title: "The AI couldn't finish",
		message: "Something went wrong while analyzing. This is usually temporary, so please try again.",
	},
	ANALYSIS_REQUIRED: {
		title: "Run a match first",
		message: "Tailoring uses the gaps found in the match analysis. Analyze your CV against this job first.",
	},
	VALIDATION_ERROR: {
		title: "Check your input",
		message: "Some fields are missing or too short. CV text needs at least 50 characters.",
	},
	BRAVE_FETCH_FAILED: {
		title: "Search unavailable",
		message: "We couldn't reach the profile search right now. Please try again in a moment.",
	},
	BRAVE_NOT_CONFIGURED: {
		title: "Profile search is off",
		message: "Profile suggestions aren't enabled on this server.",
	},
	FILE_TOO_LARGE: { title: "PDF too large", message: "Please upload a PDF under 5 MB." },
	INVALID_PDF: {
		title: "Couldn't read that PDF",
		message: "Try another file, or paste your CV text instead.",
	},
	EMPTY_EXTRACTION: {
		title: "No text found",
		message: "That PDF looks like a scan without selectable text. Paste your CV text instead.",
	},
	INVALID_CONTENT_TYPE: { title: "Unsupported file", message: "Please upload a PDF file." },
	CHECKOUT_FAILED: {
		title: "Checkout didn't open",
		message: "We couldn't start the payment. Please try again.",
	},
	BILLING_UNAVAILABLE: {
		title: "Payments unavailable",
		message: "Buying credits isn't enabled right now.",
	},
	NOT_FOUND: { title: "Not found", message: "This item doesn't exist or was deleted." },
	UNAUTHORIZED: { title: "Session expired", message: "Please sign in again." },
	NETWORK_ERROR: {
		title: "Connection problem",
		message: "We couldn't reach the server. Check your connection and try again.",
	},
};

export function toFriendlyError(e: unknown): FriendlyError {
	if (!(e instanceof ApiError)) {
		return { ...BY_CODE.NETWORK_ERROR, retryable: true };
	}
	const retryable = e.status === 0 || e.status >= 500 || e.status === 408;
	const code = typeof e.detail === "string" ? e.detail : undefined;
	const known = code ? BY_CODE[code] : undefined;
	if (known) return { ...known, retryable: known.needsCredits ? false : retryable };
	if (code === "MISSING_FILE" || code === "INVALID_FORM_DATA") {
		return { ...BY_CODE.INVALID_PDF, retryable: false };
	}
	if (retryable) {
		return {
			title: "Something went wrong",
			message: "The server had a problem handling that. Please try again.",
			retryable,
		};
	}
	return { title: "Request not accepted", message: "Please review your input and try again.", retryable };
}
