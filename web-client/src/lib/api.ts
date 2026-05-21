import type {
	Application,
	ApplicationCreate,
	ApplicationStatus,
	ApplicationUpdate,
	MatchResponse,
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(`${API_URL}${path}`, {
		...init,
		headers: {
			"Content-Type": "application/json",
			...(init?.headers ?? {}),
		},
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
	listApplications(status?: ApplicationStatus): Promise<Application[]> {
		const qs = status ? `?status=${encodeURIComponent(status)}` : "";
		return request<Application[]>(`/applications${qs}`);
	},

	getApplication(id: string): Promise<Application> {
		return request<Application>(`/applications/${id}`);
	},

	createApplication(payload: ApplicationCreate): Promise<Application> {
		return request<Application>("/applications", {
			method: "POST",
			body: JSON.stringify(payload),
		});
	},

	updateApplication(id: string, payload: ApplicationUpdate): Promise<Application> {
		return request<Application>(`/applications/${id}`, {
			method: "PATCH",
			body: JSON.stringify(payload),
		});
	},

	deleteApplication(id: string): Promise<void> {
		return request<void>(`/applications/${id}`, { method: "DELETE" });
	},

	runMatch(id: string, cvText: string, force = false): Promise<MatchResponse> {
		const qs = force ? "?force=true" : "";
		return request<MatchResponse>(`/applications/${id}/match${qs}`, {
			method: "POST",
			body: JSON.stringify({ cv_text: cvText }),
		});
	},
};
