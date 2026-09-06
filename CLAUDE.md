# LoanForge — CLAUDE.md

## Tech Stack
NestJS (backend, TypeScript, ESM) · React + Vite (frontend) · MongoDB via Docker (`docker-compose.yml`,
no local `mongod`) · npm workspaces · Vitest · dependency-cruiser.

## Architecture Boundaries
- Controller -> Service -> Repository. Repository never calls Service. Service never imports from
  another module's Repository directly — go through that module's Service.
- The scoring/pricing engine (`modules/pricing`) never calls the disbursement adapter directly (NFR-05)
  — underwriting orchestrates the sequence.
- Domain code (`src/api/src/domain/`) has zero imports from any `modules/*` — it is depended on, never
  depends on feature modules.

## Rules

### Style
- All currency and rate values are `Decimal` (decimal.js) — never `number`/`float`.
  [testable: grep for `parseFloat`/native arithmetic on money fields in review]

### Structure
- Every feature module has `controller/`, `service/`, `repository/`, `dto/` sub-folders — no flat
  modules. [testable: dependency-cruiser structure rule, added in a later step]

### Safety
- No applicant PII (name, income, account number) is ever passed to `Logger.log`/`console.log` in clear
  text — use the redaction helper in `src/api/src/common/logging.ts`.
  [testable: `.claude/hooks/pii-redaction-check.sh`]

### Convention
- Every test file name or `describe`/`it` string that covers an Acceptance Criterion includes its
  `AC-NN` id verbatim. [testable: `grep -rn "AC-[0-9][0-9]"` across test files, cross-checked against
  `specs/`]
