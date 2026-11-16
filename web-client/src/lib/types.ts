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
	analysis: MatchAnalysis | null;
	analysis_updated_at: string | null;
	suggested_profiles: StoredSuggestedProfiles | null;
	suggested_profiles_updated_at: string | null;
	tailored: TailoredCv | null;
	tailored_updated_at: string | null;
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

export interface MatchResponse {
	application_id: string;
	analysis: MatchAnalysis;
	updated_at: string;
}

export interface TailoredBullet {
	original: string;
	improved: string;
	reason: string;
}

export interface TailoredCv {
	headline: string;
	summary: string;
	bullets: TailoredBullet[];
	keywords: string[];
}

export interface TailorResponse {
	application_id: string;
	tailored: TailoredCv;
	updated_at: string;
}

export interface ApplicationStats {
	total: number;
	by_status: Record<ApplicationStatus, number>;
	average_score: number | null;
	analyzed: number;
	scores: { id: string; company: string; title: string; applied_at: string; score: number }[];
	credits_spent: number;
	credits_by_day: { day: string; credits_used: number }[];
}

export interface CreditPack {
	id: string;
	usd: number;
	credits: number;
}

export interface BillingInfo {
	credits: number;
	daily_credit_left: number;
	daily_credit: number;
	prices: { analysis: number; tailor: number };
	packs: CreditPack[];
	checkout_enabled: boolean;
	publishable_key: string | null;
}

export interface LedgerEntry {
	ref: string;
	credits: number;
	kind: "topup" | "refund" | "spend";
	note: string | null;
	created_at: string;
}

export interface PaymentStatus {
	id: string;
	pack: string;
	credits: number;
	status: "open" | "paid";
	paid_at: string | null;
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
