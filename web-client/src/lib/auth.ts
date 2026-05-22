import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { SignJWT } from "jose";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type BackendUser = {
	id: string;
	email: string;
	name: string | null;
	email_verified: boolean;
};

async function loginAtBackend(
	email: string,
	password: string,
): Promise<BackendUser | null> {
	const res = await fetch(`${API_URL}/auth/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, password }),
	});
	if (!res.ok) {
		if (res.status === 401 || res.status === 403) return null;
		throw new Error(`backend login failed: ${res.status}`);
	}
	return (await res.json()) as BackendUser;
}

async function oauthUpsertAtBackend(profile: {
	email: string;
	name?: string | null;
	image?: string | null;
}): Promise<BackendUser | null> {
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
	return (await res.json()) as BackendUser;
}

async function mintBackendJwt(userId: string, email: string): Promise<string> {
	const secret = process.env.BACKEND_JWT_SECRET;
	if (!secret) throw new Error("BACKEND_JWT_SECRET not configured");
	return await new SignJWT({ email })
		.setProtectedHeader({ alg: "HS256" })
		.setSubject(userId)
		.setIssuedAt()
		.setExpirationTime("15m")
		.sign(new TextEncoder().encode(secret));
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
			const user = await loginAtBackend(email, password);
			if (!user) return null;
			return {
				id: user.id,
				email: user.email,
				name: user.name ?? undefined,
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
			const backendUser = await oauthUpsertAtBackend({
				email,
				name: user.name,
				image: user.image,
			});
			if (!backendUser) return false;
			user.id = backendUser.id;
			return true;
		},
		async jwt({ token, user }) {
			if (user) {
				token.userId = user.id as string;
				token.email = user.email as string;
			}
			if (token.userId && token.email) {
				token.backendJwt = await mintBackendJwt(
					token.userId as string,
					token.email as string,
				);
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
