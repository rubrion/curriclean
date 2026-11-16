# Local Development

Requires Node 20+ and [Bun](https://bun.sh). Workers AI runs remotely even in `wrangler dev`, so you need `wrangler login` (and `CLOUDFLARE_ACCOUNT_ID` if your login has several accounts).

## Backend (`curriclean-api/`)

```bash
cd curriclean-api
bun install
cp .dev.vars.example .dev.vars          # fill in secrets
npx wrangler d1 migrations apply curriclean --local
npx wrangler dev --port 8787
```

Seed demo applications (optional): `npx wrangler d1 execute curriclean --local --file seeds/seed_dev.sql`.

## Frontend (`web-client/`)

```bash
cd web-client
npm install
cp .env.example .env.local              # NEXT_PUBLIC_API_URL=http://localhost:8787
npm run dev
```

## Validate

From the repo root: `make validate` (API typecheck, web lint + typecheck + build).
