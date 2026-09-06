# Execution Plan — Disbursement & Audit

## Title
Disbursement & Audit (AC-08)

## Date
2026-09-06

## Status
Done — archived 2026-09-06 by the janitor agent (feature merged into feature-1)

## Goal
On an accepted offer for an `APPROVED` application, disburse funds through a stubbed payout adapter and
persist an append-only, PII-safe disbursement record — reusing underwriting's transactional state
machine rather than inventing a second concurrency mechanism.

## Touched Files
- `specs/disbursement_spec.md` (already committed)
- `src/api/src/modules/eligibility/schema/applicant.schema.ts` — add `accountNumber`
- `scripts/seed.ts` — add synthetic account numbers to seeded applicants
- `src/api/src/modules/disbursement/schema/disbursement-record.schema.ts`
- `src/api/src/modules/disbursement/repository/disbursement.repository.ts` — insert-only
- `src/api/src/modules/disbursement/repository/applicant-account.repository.ts` — read-only lookup
  against the same `applicants` collection eligibility already owns
- `src/api/src/modules/disbursement/service/stub-payout.adapter.ts`
- `src/api/src/modules/disbursement/service/disbursement.service.ts`
- `src/api/src/modules/disbursement/controller/disbursement.controller.ts`
- `src/api/src/modules/disbursement/disbursement.module.ts`
- `src/api/src/modules/pricing/service/pricing.service.ts` — add `getOffer(applicationId)` so
  disbursement can read the persisted offer through pricing's service, not its repository directly
- `src/api/src/modules/disbursement/service/disbursement.service.spec.ts`

## Order of Operations
1. Add `accountNumber` to the `Applicant` schema and seed data — synthetic only.
2. `StubPayoutAdapter.pay(amount, accountNumber)` — deterministic fake `payoutReference`, and masks the
   account to `****<last 4 digits>`; the raw account number never leaves this call.
3. `DisbursementRecord` schema (`applicationId` unique, `amount`, `tenureMonths`, `maskedAccountReference`,
   `payoutReference`, `disbursedAt`) — repository exposes only `save()`/`findByApplicationId()`.
4. `PricingService.getOffer(applicationId)` — thin read of the already-persisted offer.
5. `DisbursementService.acceptOffer(applicationId)`: loads the application and its offer, opens a Mongo
   session, and inside one transaction calls `UnderwritingService.transition(applicationId, DISBURSED,
   session)` (reusing step8's guarded compare-and-set — `APPROVED -> DISBURSED` is the only allowed
   entry, and a second call naturally fails because the application is no longer `APPROVED`) followed by
   `disbursementRepository.save(record, session)`. Logs only the masked reference via `Logger`, never the
   raw account number.
6. Controller: `PATCH /applications/:id/accept-offer`.
7. Unit tests with fakes for `IntakeService`, `PricingService`, `UnderwritingService`, and the
   disbursement/account repositories; one test spies on `Logger.prototype.log` to assert the raw account
   number is never emitted.

## Tests
- `AC-08`: "creates a disbursement record with amount, schedule, and masked account on accepted offer"
- `AC-08`: "calls the stubbed payout adapter exactly once per accepted offer"
- `AC-08`: "rejects a second accept-offer call on an already-disbursed application"
- `NFR-03`: "never writes the raw account reference to logs"

## Open Questions
None outstanding.

## Risks
- Reusing `UnderwritingService.transition` for the `APPROVED -> DISBURSED` step means disbursement
  depends on the underwriting module; this is an intentional service-to-service dependency (not a
  repository reach-through), consistent with the architecture boundary rules in `CLAUDE.md`.
