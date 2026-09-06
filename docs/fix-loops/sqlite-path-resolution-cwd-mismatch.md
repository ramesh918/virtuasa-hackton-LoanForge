# Fix Loop — SQLite Path Silently Resolved Differently for the Server vs. the Seed Script

Real trace from the MongoDB-to-SQLite migration, not a dry run.

## Failure Detected
After migrating to SQLite and seeding synthetic data, the very first live end-to-end check (submit an
application for a seeded applicant, then trigger evaluation) gave a wrong result:

```
curl -X PATCH http://localhost:3050/applications/<id>/evaluate ...
{"eligible":false,"reason":"INELIGIBLE_AGE"}
```

`APP-0001` is seeded with `age: 34`, well inside the eligible 21–60 band — this should have passed.

## Reproduced
Added a temporary `console.log` right after the applicant lookup in
`EligibilityService.evaluate()` and re-ran the same request:

```
DEBUG applicant lookup for APP-0001 => null
```

The lookup returned `null` inside the running server, even though a standalone script (run separately,
using the exact same TypeORM `Applicant` repository code) found the row correctly:

```
found: Applicant { applicantId: 'APP-0001', name: 'Jordan Rivera', ..., age: 34, ... }
```

Same query, same code path, different result depending on which process ran it — pointed straight at an
environment/configuration difference, not application logic.

## Root Cause
`app.module.ts` configured the database as `process.env.SQLITE_DB_PATH ?? 'loanforge.sqlite'` — a bare
relative path. `scripts/seed.ts` used the same relative default. But `npm run api` is
`npm run start:dev --workspace=src/api` from the root `package.json`, and **npm workspace scripts run
with `cwd` set to the workspace directory** — so the running server resolved `'loanforge.sqlite'`
relative to `src/api/`, creating (via `synchronize: true`) an empty database at
`src/api/loanforge.sqlite`. The seed script, invoked as a plain `node scripts/seed.ts` from the repo
root, resolved the same relative default to `<repo root>/loanforge.sqlite` — a completely different,
correctly-seeded file. Confirmed by finding both files actually present on disk simultaneously.

## Fix Proposed
Stop relying on `process.cwd()` for the default path. Anchor it to each file's own location instead,
using `import.meta.url`, so the resolved absolute path is identical regardless of the invoking
directory:

```typescript
const DEFAULT_SQLITE_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '../loanforge.sqlite');
```

## Applied
Added this pattern to both `src/api/src/app.module.ts` (resolving to `src/api/loanforge.sqlite`) and
`scripts/seed.ts` (resolving to the identical absolute path from its own location in `scripts/`), and
the same fix to `web/e2e/db-fixtures.ts`, which had the same class of bug waiting to happen once its
fixtures were pointed at a real file instead of Mongo.

## Validated
Deleted every stray `loanforge.sqlite` file, reseeded, restarted the server, and repeated the exact
request: `{"eligible":true,"creditScore":816,"dti":"0.3338"}` — followed by a full real-HTTP run through
evaluate → queue → approve → offer → accept → disbursed, and a real two-request concurrency race
(`NFR-06`), all against the single correctly-resolved file.

## Knowledge Deposit
Any script or module with a relative default file path that can be invoked from more than one working
directory (a root `package.json` script delegating to a workspace, a test runner invoked from a
different folder than the server) needs a `cwd`-independent default. `import.meta.url`-anchored
resolution is now the standing pattern for this project — see the identical comment left in all three
files above.
