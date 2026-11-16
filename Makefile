# Run from the repo root. `make validate` must pass before committing.
.PHONY: install validate api-validate web-validate

install:
	cd curriclean-api && bun install
	cd web-client && npm install

api-validate:
	cd curriclean-api && bun run typecheck

web-validate:
	cd web-client && npm run lint && npm run typecheck && npx next build

validate: api-validate web-validate
