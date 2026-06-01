import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type BackendUser = {
	id: string;
	email: string;
	name: string | null;
	email_verified: boolean;
};

type BackendAuthResponse = {
	token: string;
	user: BackendUser;
};

async function loginAtBackend(
	email: string,
	password: string,
): Promise<BackendAuthResponse | null> {
	const res = await fetch(`${API_URL}/auth/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, password }),
	});
	if (!res.ok) {
		if (res.status === 401 || res.status === 403) return null;
		throw new Error(`backend login failed: ${res.status}`);
	}
	return (await res.json()) as BackendAuthResponse;
}

async function oauthUpsertAtBackend(profile: {
	email: string;
	name?: string | null;
	image?: string | null;
}): Promise<BackendAuthResponse | null> {
	const secret = process.env.AUTH_SHARED_SECRET;
	if (!secret) {
		console.warn("AUTH_SHARED_SECRET not set; cannot upsert OAuth user");
		return null;
	}
	const res = await fetch(`${API_URL}/auth/oauth-upsert`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"x-auth-secret": secret,
		},
		body: JSON.stringify({
			email: profile.email,
			name: profile.name ?? null,
			image: profile.image ?? null,
		}),
	});
	if (!res.ok) return null;
	return (await res.json()) as BackendAuthResponse;
}

const providers: NextAuthConfig["providers"] = [
	Credentials({
		credentials: {
			email: { type: "email" },
			password: { type: "password" },
		},
		async authorize(credentials) {
			const email = credentials?.email as string | undefined;
			const password = credentials?.password as string | undefined;
			if (!email || !password) return null;
			const resp = await loginAtBackend(email, password);
			if (!resp) return null;
			return {
				id: resp.user.id,
				email: resp.user.email,
				name: resp.user.name ?? undefined,
				backendJwt: resp.token,
			};
		},
	}),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
	providers.push(
		Google({
			clientId: process.env.AUTH_GOOGLE_ID,
			clientSecret: process.env.AUTH_GOOGLE_SECRET,
		}),
	);
}

if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
	providers.push(
		GitHub({
			clientId: process.env.AUTH_GITHUB_ID,
			clientSecret: process.env.AUTH_GITHUB_SECRET,
		}),
	);
}

export const authConfig: NextAuthConfig = {
	providers,
	session: { strategy: "jwt" },
	pages: { signIn: "/login" },
	callbacks: {
		async signIn({ user, account }) {
			if (!account || account.provider === "credentials") return true;
			const email = user.email;
			if (!email) return false;
			const resp = await oauthUpsertAtBackend({
				email,
				name: user.name,
				image: user.image,
			});
			if (!resp) return false;
			user.id = resp.user.id;
			// Attach the backend-issued JWT to the user object so the jwt callback can pick it up
			(user as unknown as { backendJwt?: string }).backendJwt = resp.token;
			return true;
		},
		async jwt({ token, user }) {
			if (user) {
				token.userId = user.id as string;
				token.email = user.email as string;
				// Carry the backend-issued JWT forward into the session token
				const backendJwt = (user as unknown as { backendJwt?: string }).backendJwt;
				if (backendJwt) token.backendJwt = backendJwt;
			}
			return token;
		},
		async session({ session, token }) {
			if (token.userId) session.user.id = token.userId as string;
			if (token.backendJwt) {
				(session as unknown as { backendJwt?: string }).backendJwt =
					token.backendJwt as string;
			}
			return session;
		},
	},
	trustHost: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
