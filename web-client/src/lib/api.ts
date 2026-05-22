import type {
	Application,
	ApplicationCreate,
	ApplicationStatus,
	ApplicationUpdate,
	CvParseResponse,
	MatchResponse,
	SuggestedProfilesResponse,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
	constructor(
		public status: number,
		message: string,
		public detail?: unknown,
	) {
		super(message);
		this.name = "ApiError";
	}

	get isClientError(): boolean {
		return this.status >= 400 && this.status < 500;
	}
}

async function request<T>(
	path: string,
	bearer: string | null | undefined,
	init?: RequestInit,
): Promise<T> {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		...((init?.headers as Record<string, string>) ?? {}),
	};
	if (bearer) headers["Authorization"] = `Bearer ${bearer}`;

	const res = await fetch(`${API_URL}${path}`, {
		...init,
		headers,
	});

	if (!res.ok) {
		let detail: unknown = undefined;
		try {
			const body = (await res.json()) as { detail?: unknown };
			detail = body?.detail ?? body;
		} catch {
			detail = await res.text().catch(() => undefined);
		}
		throw new ApiError(
			res.status,
			`Request failed: ${res.status} ${res.statusText}`,
			detail,
		);
	}

	if (res.status === 204) return undefined as T;
	return (await res.json()) as T;
}

export const api = {
	listApplications(
		bearer: string | null | undefined,
		status?: ApplicationStatus,
	): Promise<Application[]> {
		const qs = status ? `?status=${encodeURIComponent(status)}` : "";
		return request<Application[]>(`/applications${qs}`, bearer);
	},

	getApplication(bearer: string | null | undefined, id: string): Promise<Application> {
		return request<Application>(`/applications/${id}`, bearer);
	},

	createApplication(
		bearer: string | null | undefined,
		payload: ApplicationCreate,
	): Promise<Application> {
		return request<Application>(`/applications`, bearer, {
			method: "POST",
			body: JSON.stringify(payload),
		});
	},

	updateApplication(
		bearer: string | null | undefined,
		id: string,
		payload: ApplicationUpdate,
	): Promise<Application> {
		return request<Application>(`/applications/${id}`, bearer, {
			method: "PATCH",
			body: JSON.stringify(payload),
		});
	},

	deleteApplication(bearer: string | null | undefined, id: string): Promise<void> {
		return request<void>(`/applications/${id}`, bearer, { method: "DELETE" });
	},

	runMatch(
		bearer: string | null | undefined,
		id: string,
		cvText: string,
		force = false,
	): Promise<MatchResponse> {
		const qs = force ? "?force=true" : "";
		return request<MatchResponse>(`/applications/${id}/match${qs}`, bearer, {
			method: "POST",
			body: JSON.stringify({ cv_text: cvText }),
		});
	},

	async parseCvPdf(
		bearer: string | null | undefined,
		file: File,
	): Promise<CvParseResponse> {
		const form = new FormData();
		form.append("file", file);
		const headers: Record<string, string> = {};
		if (bearer) headers["Authorization"] = `Bearer ${bearer}`;

		const res = await fetch(`${API_URL}/cv/parse-pdf`, {
			method: "POST",
			body: form,
			headers,
		});
		if (!res.ok) {
			let detail: unknown = undefined;
			try {
				const body = (await res.json()) as { detail?: unknown };
				detail = body?.detail ?? body;
			} catch {
				detail = await res.text().catch(() => undefined);
			}
			throw new ApiError(
				res.status,
				`PDF parse failed: ${res.status} ${res.statusText}`,
				detail,
			);
		}
		return (await res.json()) as CvParseResponse;
	},

	getSuggestedProfiles(
		bearer: string | null | undefined,
		applicationId: string,
		opts: { refresh?: boolean; limit?: number } = {},
	): Promise<SuggestedProfilesResponse> {
		const refresh = opts.refresh ? "true" : "false";
		const limit = opts.limit ?? 10;
		return request<SuggestedProfilesResponse>(
			`/applications/${applicationId}/suggested-profiles?refresh=${refresh}&limit=${limit}`,
			bearer,
			{ method: "POST" },
		);
	},
};

export type SessionLike = { backendJwt?: string | null } | null | undefined;

export function bearerFromSession(session: SessionLike): string | null {
	return session?.backendJwt ?? null;
}
