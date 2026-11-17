# CurriClean for Android

A [Capacitor](https://capacitorjs.com) shell around [curriclean.com](https://curriclean.com/dashboard). **Every web-client deploy updates the app** with no store release. Ship a new store build only when this folder changes (icons, permissions, Capacitor version).

- App id: `com.curriclean`, name **CurriClean**. Opens on `/dashboard` (login if signed out).
- Only `curriclean.com` and GitHub's sign-in load inside the app; other links open in the system browser.
- Offline, the app shows `www/offline.html`.
- **No purchases inside the app.** The shell adds `CurriCleanApp` to the user agent and the web client (`src/lib/storeApp.ts`, `useInStoreApp()`) leaves out the billing page, "Top up" / "Buy credits" buttons and links, and the landing (with its pricing) redirects to the dashboard. The API refuses `POST /billing/checkout` for that user agent. Google Play only allows digital purchases through its own billing; the web keeps Stripe. Balances and the free daily credit still show.
- **No Google sign-in inside the app**: Google blocks OAuth in embedded web views (`disallowed_useragent`). Email + password and GitHub work.

## Setup

Needs Node 22+.

```bash
npm install
npm run assets   # icons and splash screens from assets/ (already generated)
npx cap sync android
```

## Android

Needs JDK 21 and the Android SDK (platform 36).

```bash
echo "sdk.dir=$HOME/Android/Sdk" > android/local.properties
JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 npm run apk:debug
# → android/app/build/outputs/apk/debug/app-debug.apk (install with adb install)
```

## Release on Google Play (Codemagic)

`codemagic.yaml` at the repo root builds the signed AAB with the team keystore `rubrion-release` and publishes it with `fastlane supply`: the `production` branch goes to the production track, any other branch to internal testing. One-time setup:

1. Play Console: create the app `com.curriclean`, give the Play service account access.
2. Codemagic: add this repo (type Ionic/Capacitor) and an env group `curriclean` with the secure variable `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS` (the service-account JSON).
3. First production release may need a manual draft upload of the `.aab` (kept as a build artifact).

Version name comes from `package.json`, bumped from Conventional Commits by `.github/workflows/release.yml` (shared engine in `rubrion/.github`; dormant until `AUTO_RELEASE=true`). Release notes: `store/whatsnew/<locale>.txt`.

**Play Console listing checklist**

- **App access:** the app is behind a login wall, so give reviewers a demo account (email + password, already verified).
- **Data safety:** email, name, and job descriptions/applications stored; CVs are processed and not kept.
- **Account deletion:** in the app (account menu → Delete account) and on the web at `https://curriclean.com/delete-account` (the URL Play asks for). API: `DELETE /auth/account`.
- **Privacy policy URL:** `https://curriclean.com/privacy`.
