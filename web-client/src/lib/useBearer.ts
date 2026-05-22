"use client";

import { useSession } from "next-auth/react";

export function useBearer(): string | null {
	const { data } = useSession();
	return data?.backendJwt ?? null;
}
