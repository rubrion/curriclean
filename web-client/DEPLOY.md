# Deploying SpecFit Web Client (Cloudflare Workers)

The web client deploys to Cloudflare Workers via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare).

## One-time setup

1. **Cloudflare account.** Authenticate Wrangler once:

   ```bash
   npx wrangler login
   ```

2. **Backend URL.** Decide your production API origin (e.g. the Railway-hosted FastAPI).

3. **CORS.** On the backend, set `CORS_ORIGINS` to the Worker URL
   (e.g. `https://specfit.<your-subdomain>.workers.dev` or your custom domain).

## Environment variables

| Variable              | Where it lives                                                                                                  | Notes                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | `.env.production` (local deploys) **or** Cloudflare dashboard → Workers → Settings → Build variables (CI/CD).   | Inlined into the client bundle at build time. Never use for secrets.                        |
| `NEXTJS_ENV`          | `.dev.vars` (local dev) — already set to `development`.                                                          | Tells OpenNext which Next.js env file to load during `wrangler dev`.                        |

There are no runtime secrets on the Worker — the backend lives separately on Railway. If you later add server-side env vars, use `npx wrangler secret put <NAME>` for sensitive ones and `vars` in `wrangler.jsonc` for non-sensitive.

## Local preview (workerd runtime)

Same `workerd` runtime the production Worker uses:

```bash
npm run preview
```

## Deploy from your machine

```bash
# 1. fill in production values
cp .env.production.example .env.production
$EDITOR .env.production   # set NEXT_PUBLIC_API_URL

# 2. deploy (default env)
npm run deploy

# 2a. or named environment
npm run deploy -- --env production
```

`npm run deploy` runs `opennextjs-cloudflare build && opennextjs-cloudflare deploy`. The build calls `next build`, which loads `.env.production`, then OpenNext bundles the worker and uploads it.

## Custom domain

Two options:

**A. Wrangler config** — edit `wrangler.jsonc`, add under the relevant env:

```jsonc
"routes": [
  { "pattern": "specfit.example.com", "custom_domain": true }
]
```

Then `npm run deploy -- --env production`.

**B. Dashboard** — Workers & Pages → your Worker → **Triggers → Add Custom Domain**.

The zone must already be on your Cloudflare account.

## CI/CD via Workers Builds

If you connect the GitHub repo as a [Workers Build](https://developers.cloudflare.com/workers/ci-cd/builds/), set:

- **Build command**: `npm run deploy`
- **Build directory**: `web-client/`
- **Build variables**: add `NEXT_PUBLIC_API_URL=<your prod backend URL>`. This becomes available to `next build` automatically.

Secrets (if any future ones are added) go in **Secrets**, not **Build variables**.

## Verifying

After deploy, hit:

- `https://specfit.<subdomain>.workers.dev/applications` — should render the SpecFit applications list (empty until backend is reachable).
- Network tab → confirm requests go to `NEXT_PUBLIC_API_URL` and not `localhost:8000`.

If you see `Failed to fetch`, check CORS on the backend (`CORS_ORIGINS`) and confirm the API URL was baked into the build.
