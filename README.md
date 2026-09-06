# virtuasa-hackton-LoanForge
Retail Loan Origination &amp; Underwriting

LoanForge is a self-serve retail loan origination platform for Nord Retail Bank: application intake, policy-based eligibility and credit rules, risk-based pricing, an underwriting workflow, and disbursement. All external integrations (credit bureau, KYC, core-banking payout) are stubbed. See `docs/business-case.md` and `specs/app_spec.md` for details, and `prompts/plan.md` for the build roadmap.

## Tech Stack
NestJS (backend, TypeScript) · React + Vite (frontend) · MongoDB · npm workspaces · Vitest.

## Quick Start
1. `npm install`
2. Copy `src/api/.env.example` to `src/api/.env` and point `MONGO_URI` at a local/dev MongoDB (a single-node replica set is required for transactions — see `docs/debugging.md` once written).
3. `npm run seed` — loads synthetic applicants and loan products.
4. `npm run api` (backend on :3000) and `npm run web` (frontend on :5173) in separate terminals.

## Tests
`npm test` runs the backend Vitest suite. `npm run test:arch --workspace=src/api` runs the architecture boundary test (added in a later step).
