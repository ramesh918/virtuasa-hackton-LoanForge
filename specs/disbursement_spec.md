# Disbursement & Audit — Feature Spec

References `specs/app_spec.md`. Triggered when an `APPROVED` application's offer is accepted by the
applicant. Produces a disbursement record via a stubbed core-banking payout adapter, reusing the
`specs/underwriting_spec.md` state machine (`APPROVED -> DISBURSED`) so the same transactional,
concurrency-safe guard applies here too.

## Acceptance Criteria

**AC-08**: On an `APPROVED` application whose offer is accepted, a `DisbursementRecord` is created
(amount, tenure/schedule, masked account reference, payout reference) via a stubbed payment adapter
(`StubPayoutAdapter`). The state transition to `DISBURSED` and the `DisbursementRecord` insert happen in
a single transaction — the audit trail (state changes, decisions, disbursement) is append-only
end-to-end.

## Edge Cases
- Accepting the same offer twice → the second call is rejected by the underlying state machine (the
  application is already `DISBURSED`, and `DISBURSED -> DISBURSED` is not an allowed transition) —
  never a second disbursement record.
- The account reference is masked (e.g. `****1234`) in the stored record and is the only form of the
  account number that is ever logged (NFR-03) — the raw account number is never passed to a logger.

## Out of Scope
Real payment/core-banking rails, repayment servicing.
