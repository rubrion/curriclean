import type { CapacitorConfig } from '@capacitor/cli';

// The app is curriclean.com in a native shell: every web deploy updates the
// app too. Only curriclean.com and GitHub's sign-in load inside; any other
// link opens in the browser.
const config: CapacitorConfig = {
	appId: 'com.curriclean',
	appName: 'CurriClean',
	webDir: 'www',
	server: {
		url: 'https://curriclean.com/dashboard',
		allowNavigation: ['curriclean.com', 'github.com'],
		errorPath: 'offline.html',
	},
	// web-client reads it to leave out credit top-ups and Google sign-in
	// (src/lib/storeApp.ts); the API refuses checkout for it too. Google Play
	// only allows digital purchases through its own billing.
	appendUserAgent: 'CurriCleanApp',
	backgroundColor: '#FBF7F2',
	android: { allowMixedContent: false },
};

export default config;
