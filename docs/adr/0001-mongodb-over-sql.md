# ADR 0001: MongoDB (single-node replica set) over a relational database

## Status
Superseded by [ADR 0002](0002-sqlite-over-mongodb.md) — MongoDB required Docker to run locally, which
became a real barrier for anyone picking up this repository without it already installed. Kept here as
a historical record; the technical tradeoffs below (transactions, concurrency guard, replica-set
requirement) are still an accurate account of what was actually built and debugged at the time.

## Context
LoanForge's core records — applications, decisions, offers, disbursements — are append-only and
document-shaped: each is a self-contained object with no need for cross-table joins at this scope. The
brief allows H2/SQLite, an RDBMS, or MongoDB, and doesn't grade the choice itself.

## Decision
Use MongoDB (via Docker, `docker-compose.yml`) with native multi-document transactions for the
`APPROVED -> DISBURSED` and decision-recording paths (NFR-06), instead of an RDBMS.

## Consequences
- Schema evolution stayed simple during a fast-moving build — Mongoose schemas map almost 1:1 onto the
  domain objects in `specs/`, with no migration tooling needed.
- NFR-06's "no double transition under concurrent requests" guarantee is **not** free the way an RDBMS
  row lock would make it — it required an explicit atomic compare-and-set
  (`findOneAndUpdate({ applicationId, state: fromState }, ...)`, see
  `src/api/src/modules/underwriting/repository/underwriting.repository.ts`) plus a real Mongo session/
  transaction for the combined state-change-and-decision-record write.
- Multi-document transactions require a replica set, even a single-node one — a plain standalone
  `mongod` throws `Transaction numbers are only allowed on a replica set member or mongos`. This was hit
  and fixed for real while building the underwriting feature; see `docs/debugging.md` for the full trace
  and how `docker-compose.yml`'s `mongo-init` service handles it transparently on `docker compose up -d`.
- Application, applicant profile (`eligibility`'s `Applicant` schema), and offer/decision/disbursement
  records live in separate collections queried by more than one module's repository — acceptable here
  since Application is the one central aggregate every feature genuinely needs (see
  `docs/architecture.md`), not a sign that a relational join would have been simpler.
