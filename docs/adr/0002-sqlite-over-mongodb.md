# ADR 0002: SQLite (via TypeORM + better-sqlite3) over MongoDB

## Status
Accepted

## Context
[ADR 0001](0001-mongodb-over-sql.md) chose MongoDB, which required Docker to run locally (a replica
set, specifically, for NFR-06's transactions). In practice this meant anyone cloning the repository
needed Docker Desktop installed and running before the app would even boot — a real barrier, and a
recurring source of friction during this build itself (Docker Desktop's backend crashed under host
memory pressure multiple times in one session, each requiring a manual restart before the app could
reconnect). The brief explicitly allows H2/SQLite as a valid choice and does not grade the database
technology itself.

## Decision
Replace MongoDB/Mongoose with SQLite via TypeORM and the `better-sqlite3` driver — a single file
(`src/api/loanforge.sqlite`), no server process, no container runtime. `better-sqlite3` ships prebuilt
native binaries for common platforms, so `npm install` does not require a C++ toolchain in the common
case.

## Consequences
- **Zero external dependencies to run the app** — `npm install && npm run seed && npm run api` is the
  entire setup. This was the whole point of the migration.
- **NFR-06 got simpler, not harder.** MongoDB needed a replica set purely to unlock multi-document
  transactions (see the now-historical `docs/debugging.md` trace). SQLite's transactions work
  out of the box; the same atomic-compare-and-set pattern
  (`UPDATE applications SET state = ? WHERE applicationId = ? AND state = ?`, checking the affected-row
  count) reused the exact guarantee `findOneAndUpdate` gave under Mongo, just expressed as SQL — see
  `src/api/src/modules/underwriting/repository/underwriting.repository.ts`.
- The repository-pattern design (every module hides its persistence behind a small interface,
  `IntakeRepository`, `PricingRepository`, etc.) meant all 51 existing unit/controller tests — which
  depend only on those interfaces via in-memory fakes — needed **zero changes** for this migration. Only
  the concrete `Sqlite*Repository` implementations and the two services doing manual transaction
  management (`UnderwritingService`, `DisbursementService`, via `DataSource.transaction()` instead of
  Mongoose sessions) changed.
- The exact const/type name-collision bug documented in
  `docs/fix-loops/mongoose-schema-enum-type-collision.md` (TypeScript's `emitDecoratorMetadata`
  resolving `ApplicationState` the type to the identically-named const object at runtime) applies
  identically to TypeORM's `@Column()` decorator — every entity re-applies the same `type: 'text'`
  workaround proactively rather than rediscovering the crash.
- `better-sqlite3`'s synchronous API meant one real path-resolution bug surfaced during this migration:
  npm workspace scripts run with `cwd` set to the workspace directory, so a bare relative default
  path (`'loanforge.sqlite'`) silently resolved to two different files depending on whether the API
  server or the seed script was the one reading it. Fixed by anchoring the default path to each file's
  own location via `import.meta.url` instead of `process.cwd()` — see `app.module.ts` and
  `scripts/seed.ts`.
- Applicant profile, application, offer, decision, and disbursement records live in separate tables
  queried by more than one module's repository, same as under MongoDB — this was a modeling choice
  about Application being the one shared aggregate (see `docs/architecture.md`), not something specific
  to either database.
