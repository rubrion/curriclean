"use client";

import { createContext, useContext } from "react";

import { api } from "./api";
import type { BillingInfo } from "./types";
import { useApiQuery } from "./useApiQuery";

type BillingContextValue = {
	billing: BillingInfo | null;
	refresh: () => void;
};

const BillingContext = createContext<BillingContextValue>({
	billing: null,
	refresh: () => {},
});

/** Credit balance and free allowance, shared by the sidebar, AI panels and billing page. */
export function BillingProvider({ children }: { children: React.ReactNode }) {
	const { data, reload } = useApiQuery("billing", (bearer) => api.getBilling(bearer));
	return <BillingContext.Provider value={{ billing: data, refresh: reload }}>{children}</BillingContext.Provider>;
}

export function useBilling() {
	return useContext(BillingContext);
}
