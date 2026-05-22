export type ApplicationStatus =
	| "saved"
	| "applied"
	| "interviewing"
	| "offer"
	| "rejected"
	| "withdrawn";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
	"saved",
	"applied",
	"interviewing",
	"offer",
	"rejected",
	"withdrawn",
];

export interface Application {
	id: string;
	company: string;
	title: string;
	description: string;
	applied_at: string;
	status: ApplicationStatus;
	analysis: StoredAnalysis | null;
	analysis_hash: string | null;
	analysis_updated_at: string | null;
	suggested_profiles: StoredSuggestedProfiles | null;
	suggested_profiles_updated_at: string | null;
	created_at: string;
	updated_at: string;
}

export interface StoredSuggestedProfiles {
	hits: ProfileHit[];
}

export interface ApplicationCreate {
	company: string;
	title: string;
	description: string;
	applied_at: string;
	status?: ApplicationStatus;
}

export interface ApplicationUpdate {
	company?: string;
	title?: string;
	description?: string;
	applied_at?: string;
	status?: ApplicationStatus;
}

export interface MatchAnalysis {
	score: number;
	summary: string;
	strengths: string[];
	gaps: string[];
	interview_questions: string[];
}

export interface MatchMetrics {
	model: string;
	tokens_in: number;
	tokens_out: number;
	latency_ms: number;
	cost_estimate_usd: number;
	cached: boolean;
	cache_key: string;
}

export interface StoredAnalysis {
	analysis: MatchAnalysis;
	metrics: MatchMetrics;
}

export interface MatchResponse {
	application_id: string;
	analysis: MatchAnalysis;
	metrics: MatchMetrics;
	updated_at: string;
}

export interface CvParseResponse {
	text: string;
}

export interface ProfileHit {
	url: string;
	title: string;
	description: string;
}

export interface SuggestedProfilesResponse {
	hits: ProfileHit[];
}
