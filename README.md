# virtuasa-hackton-LoanForge
Retail Loan Origination &amp; Underwriting

LoanForge is a self-serve retail loan origination platform for Nord Retail Bank: application intake, policy-based eligibility and credit rules, risk-based pricing, an underwriting workflow, and disbursement. All external integrations (credit bureau, KYC, core-banking payout) are stubbed. See `docs/business-case.md` and `specs/app_spec.md` for details, and `prompts/plan.md` for the build roadmap.

## Tech Stack
NestJS (backend, TypeScript) · React + Vite (frontend) · SQLite via TypeORM/better-sqlite3 · npm workspaces · Vitest.

## Quick Start
1. `npm install`
2. `npm run seed` — creates `src/api/loanforge.sqlite` (a single file, no server or container to run) and loads synthetic applicants and loan products. No Docker, no external database — `better-sqlite3` ships a prebuilt native binary for common platforms.
3. `npm run api` (backend on :3000) and `npm run web` (frontend on :5173) in separate terminals.

Override the database location with `SQLITE_DB_PATH=/absolute/path/to/file.sqlite` if you don't want it living inside `src/api/`.

## Tests
`npm test --workspace=src/api` runs the backend Vitest suite (51 tests). `npm run test:arch --workspace=src/api` runs the dependency-cruiser architecture boundary tests (NFR-05). `npm run test:cov --workspace=src/api` generates the coverage report (`src/api/coverage/lcov.info`). `npm run test:e2e --workspace=web` runs the Playwright E2E suite (requires the API and web dev servers already running).
