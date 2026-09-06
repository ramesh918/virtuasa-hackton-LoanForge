# Debugging Notes — Environment-First Resolution

## Issue: MongoDB transactions require a replica set

**Historical — no longer applicable.** The project migrated from MongoDB to SQLite
(`docs/adr/0002-sqlite-over-mongodb.md`), which has no replica-set requirement for transactions at all.
Kept as a real, accurate trace of an issue actually hit and resolved at the time; see
`docs/fix-loops/sqlite-path-resolution-cwd-mismatch.md` for the equivalent real incident from the
SQLite migration itself.

## Symptom
Building the underwriting feature (step 8) required wrapping a state transition and a `DecisionRecord`
insert in one atomic transaction (NFR-06). The Docker Mongo setup from step 1 (`docker-compose.yml`) ran
a single plain `mongod` — no replica set. Before wiring `connection.startSession()` /
`session.withTransaction()` into `UnderwritingService`, the exact failure mode was reproduced directly
against that setup with a throwaway standalone container and a minimal transaction:

```
node --input-type=module -e "
import { MongoClient } from 'mongodb';
const client = new MongoClient('mongodb://localhost:27118/loanforge_test');
await client.connect();
const session = client.startSession();
await session.withTransaction(async () => {
  await client.db().collection('tx_test').insertOne({ ok: true }, { session });
});
"
```

```
TRANSACTION FAILED: Transaction numbers are only allowed on a replica set member or mongos
```

## Environment-First Investigation
Before touching any application code: confirmed this was a topology issue, not a code bug, by checking
what MongoDB actually requires for multi-document transactions — a replica set, even a single-node one.
The plain `mongod` from step 1's `docker-compose.yml` was never configured as one. This was verified by
reproducing the failure in isolation (above) against a fresh standalone container, independent of any
application code, before writing a single line of `UnderwritingService`.

## Resolution
Reconfigured `docker-compose.yml`'s `mongo` service to start with `--replSet rs0`, and added a one-shot
`mongo-init` service (depends on `mongo`'s healthcheck) that runs `rs.initiate()` on first boot only —
idempotent, so `docker compose up -d` still stays a single command (Deliverable 1's "single command"
quick-start requirement). The connection string gained `?replicaSet=rs0&directConnection=true` (a
single-member replica set accessed via one host needs `directConnection=true` for the Node driver to use
it correctly). Verified against the *real* project setup (not the throwaway container) with the same
transaction pattern — see the `session.withTransaction` call in
`src/api/src/modules/underwriting/service/underwriting.service.ts`, and the real HTTP concurrency test
in `docs/plans/archive/underwriting.md`'s Tests section, which exercises the exact transaction path this
issue was about.

## Lesson
Diagnose the environment before touching code whenever the error message names infrastructure
capabilities ("replica set", "mongos") rather than application logic. Encoded into `README.md`'s
Quick Start (explicitly calling out that a single-node replica set is required, not just "a MongoDB
instance") and `docs/plans/archive/underwriting.md`'s Risks section, so the next feature that needs a
transaction doesn't lose time rediscovering this.
