# Execution Plan — Underwriting & Approval Workflow

## Title
Underwriting & Approval Workflow (AC-06, AC-07, NFR-06)

## Date
2026-09-06

## Status
Done — archived 2026-09-06 by the janitor agent (feature merged into feature-1)

## Goal
Enforce the full application lifecycle as an explicit state machine, expose an underwriter review queue
with recorded decisions, and make every transition safe under concurrent requests.

## Touched Files
- `specs/underwriting_spec.md` (already committed)
- `docker-compose.yml`, `src/api/.env.example`, `src/api/src/app.module.ts`, `scripts/seed.ts` — Mongo
  now runs as a single-node replica set so multi-document transactions work (see Risks)
- `src/api/src/modules/underwriting/service/state-machine.ts` — allowed-transition table + guard
- `src/api/src/modules/underwriting/schema/decision-record.schema.ts`
- `src/api/src/modules/underwriting/repository/underwriting.repository.ts` — guarded
  `findOneAndUpdate` on `Application`
- `src/api/src/modules/underwriting/repository/decision.repository.ts` — insert-only
- `src/api/src/modules/underwriting/service/underwriting.service.ts`
- `src/api/src/modules/underwriting/controller/underwriting.controller.ts`
- `src/api/src/modules/underwriting/underwriting.module.ts`
- `src/api/src/modules/eligibility/service/eligibility.service.ts` — re-pointed at
  `UnderwritingService.transition` instead of `IntakeService.updateState` directly
- `src/api/src/modules/underwriting/service/underwriting.service.spec.ts`

## Order of Operations
1. `state-machine.ts`: `ALLOWED_TRANSITIONS: Record<ApplicationState, ApplicationState[]>` and
   `assertTransitionAllowed(from, to)` throwing `InvalidApplicationStateException` otherwise.
2. `DecisionRecord` schema (`applicationId`, `actor`, `decision`, `reason`, `timestamp`) in its own
   `decisions` collection; its repository exposes only `record()` and `findByApplicationId()` — no
   update/delete (NFR-02).
3. `UnderwritingRepository.transition(applicationId, fromState, toState, session)` —
   `findOneAndUpdate({ applicationId, state: fromState }, { $set: { state: toState } }, { session })`;
   returns `null` if the current state no longer matches `fromState` (lost the race).
4. `UnderwritingService.transition(applicationId, toState)`: loads the current application, calls
   `assertTransitionAllowed`, then attempts the guarded repository update. A `null` result means another
   request won the race on the exact same `fromState` — throw a `ConflictException` distinct from
   `InvalidApplicationStateException`.
5. `UnderwritingService.decide(applicationId, actor, decision, reason)`: opens a Mongo session/
   transaction, calls `transition` and `decisionRepository.record` inside it, commits — both persist or
   neither does.
6. `UnderwritingService.getQueue()`: applications with `state` in `{UNDER_REVIEW, MANUAL_REVIEW}`.
7. Controller: `GET /queue`, `PATCH /applications/:id/decision`.
8. Re-point `EligibilityService`'s auto-reject calls at `UnderwritingService.transition` instead of
   `IntakeService.updateState`, closing the gap flagged as a risk in `docs/plans/eligibility.md`.
9. Unit tests with an in-memory fake repository that simulates the race for the concurrency test
   (two `Promise.all`'d calls against a shared in-memory store guarded the same way the real
   `findOneAndUpdate` is).

## Tests
- `AC-06`: "enforces SUBMITTED -> UNDER_REVIEW -> APPROVED as a valid path"
- `AC-06`: "throws InvalidApplicationStateException on an illegal transition (SUBMITTED -> DISBURSED)"
- `AC-07`: "lets an underwriter approve from the queue and records actor+timestamp"
- `AC-07`: "lets an underwriter request more info, moving the application to MANUAL_REVIEW"
- `NFR-06`: "under two concurrent decision requests, exactly one succeeds and the other conflicts"

## Open Questions
- None outstanding — the transaction/replica-set gap flagged as an open risk in step1's README note is
  resolved here (see `docs/debugging.md`, written in a later step, for the diagnosis trace).

## Risks
- Multi-document Mongo transactions require a replica set; a plain standalone `mongod` (or the earlier
  single-container Docker setup from step1) throws `Transaction numbers are only allowed on a replica
  set member`. `docker-compose.yml` now starts Mongo with `--replSet rs0` plus a one-shot `mongo-init`
  service that runs `rs.initiate()` on first boot only — `docker compose up -d` remains a single command.
