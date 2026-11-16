"use client";

import { useCallback, useEffect, useState } from "react";

import { type FriendlyError, toFriendlyError } from "./errors";
import { useBearer } from "./useBearer";

type State<T> = { data: T | null; error: FriendlyError | null };

/**
 * Fetch with the signed-in user's token whenever `key` changes (null skips).
 * `reload()` refetches; `setData` lets pages apply optimistic updates.
 */
export function useApiQuery<T>(key: string | null, fetcher: (bearer: string) => Promise<T>) {
	const bearer = useBearer();
	const [state, setState] = useState<State<T>>({ data: null, error: null });
	const [nonce, setNonce] = useState(0);

	useEffect(() => {
		if (!bearer || key === null) return;
		let cancelled = false;
		fetcher(bearer).then(
			(data) => {
				if (!cancelled) setState({ data, error: null });
			},
			(e: unknown) => {
				if (!cancelled) setState((s) => ({ ...s, error: toFriendlyError(e) }));
			},
		);
		return () => {
			cancelled = true;
		};
		// The fetcher is re-created every render; `key` identifies what to load.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [bearer, key, nonce]);

	const reload = useCallback(() => setNonce((n) => n + 1), []);
	const setData = useCallback(
		(update: T | null | ((prev: T | null) => T | null)) =>
			setState((s) => ({
				...s,
				data: typeof update === "function" ? (update as (p: T | null) => T | null)(s.data) : update,
			})),
		[],
	);

	return { data: state.data, error: state.error, reload, setData };
}
