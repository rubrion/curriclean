"use client";

import { createContext, useContext } from "react";

const StoreAppContext = createContext(false);

/** Provides the server's store-app check (lib/storeApp.ts) to client components. */
export function StoreAppProvider({ value, children }: { value: boolean; children: React.ReactNode }) {
	return <StoreAppContext.Provider value={value}>{children}</StoreAppContext.Provider>;
}

/** True inside the store app, where buying credits is hidden. */
export function useInStoreApp() {
	return useContext(StoreAppContext);
}
