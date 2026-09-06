# LoanForge — CLAUDE.md

## Tech Stack
NestJS (backend, TypeScript, ESM) · React + Vite (frontend) · MongoDB via Docker (`docker-compose.yml`,
no local `mongod`) · npm workspaces · Vitest · dependency-cruiser.

## Architecture Boundaries
See `docs/architecture.md` for the diagram and full rationale; enforced by `.dependency-cruiser.cjs`
(`npm run test:arch --workspace=src/api`).
- Controller -> Service -> Repository. Repository never calls Service.
- The scoring/pricing and eligibility engines never call the disbursement adapter directly (NFR-05) —
  only underwriting/disbursement orchestrate the `APPROVED -> DISBURSED` payout step.
- Domain code (`src/api/src/domain/`) has zero imports from any `modules/*` — it is depended on, never
  depends on feature modules.
- Cross-module data access goes through the owning module's Service, not its Repository — the one
  exception is reusing another module's schema class to register a second, read-only Mongoose model
  against the same collection (a data-shape reuse, not a repository call).

## Rules

### Style
- All currency and rate values are `Decimal` (decimal.js) — never `number`/`float`.
  [testable: grep for `parseFloat`/native arithmetic on money fields in review]

### Structure
- Every feature module has `controller/`, `service/`, `repository/`, `schema/` sub-folders — no flat
  modules. [testable: `.dependency-cruiser.cjs` boundary rules, `npm run test:arch --workspace=src/api`]

### Safety
- No applicant PII (name, income, account number) is ever passed to `Logger.log`/`console.log` in clear
  text — use the redaction helper in `src/api/src/common/logging.ts`.
  [testable: `.claude/hooks/pii-redaction-check.sh`]

### Convention
- Every test file name or `describe`/`it` string that covers an Acceptance Criterion includes its
  `AC-NN` id verbatim. [testable: `grep -rn "AC-[0-9][0-9]"` across test files, cross-checked against
  `specs/`]
