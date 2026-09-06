# virtuasa-hackton-LoanForge
Retail Loan Origination &amp; Underwriting

LoanForge is a self-serve retail loan origination platform for Nord Retail Bank: application intake, policy-based eligibility and credit rules, risk-based pricing, an underwriting workflow, and disbursement. All external integrations (credit bureau, KYC, core-banking payout) are stubbed. See `docs/business-case.md` and `specs/app_spec.md` for details, and `prompts/plan.md` for the build roadmap.

## Tech Stack
NestJS (backend, TypeScript) · React + Vite (frontend) · MongoDB (Docker) · npm workspaces · Vitest.

## Quick Start
1. `npm install`
2. `docker compose up -d` — starts MongoDB in a container on `localhost:27117` (data persisted in the `loanforge-mongo-data` volume). The project runs MongoDB via Docker only; no local MongoDB install is required or expected.
3. Copy `src/api/.env.example` to `src/api/.env` (defaults already point at the Dockerized Mongo instance).
4. `npm run seed` — loads synthetic applicants and loan products.
5. `npm run api` (backend on :3000) and `npm run web` (frontend on :5173) in separate terminals.

A single-node replica set will be required once transactional writes land (underwriting decisions, NFR-06) — see `docs/debugging.md` once written for how that's configured on top of this same container.

## Tests
`npm test` runs the backend Vitest suite. `npm run test:arch --workspace=src/api` runs the architecture boundary test (added in a later step).
