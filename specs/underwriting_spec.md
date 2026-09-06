# Underwriting & Approval Workflow — Feature Spec

References `specs/app_spec.md`. Owns the application lifecycle state machine and the underwriter-facing
review queue and decision record.

## Acceptance Criteria

**AC-06**: Lifecycle state machine
`SUBMITTED -> UNDER_REVIEW -> (APPROVED | REJECTED | MANUAL_REVIEW) -> DISBURSED / CLOSED` is enforced
via an explicit allowed-transition table. Any transition not in that table throws
`InvalidApplicationStateException`, and the application's stored state is left unchanged. `SUBMITTED ->
REJECTED` is also allowed directly, for eligibility's automatic decline path (`specs/eligibility_spec.md`,
AC-02/AC-03) — that decision never goes through a human queue. `SUBMITTED -> UNDER_REVIEW` is driven by
eligibility's orchestration endpoint (`specs/eligibility_spec.md`'s `POST /applications/:id/evaluate`),
not by anything in this module — underwriting only guards and records the transition, it doesn't trigger
it.

**AC-07**: An underwriter can approve, decline, or request more information from a review queue (query:
applications in `UNDER_REVIEW` or `MANUAL_REVIEW`). Every decision is recorded as an append-only
`DecisionRecord` with `actor` (underwriter id), `decision`, `reason`, and `timestamp`.

**NFR-06** (reinforced here): application state transitions are transactional. Two concurrent decision
requests against the same application result in exactly one success; the other is rejected with a
conflict, never a silent overwrite or a double-write.

## Edge Cases
- Two concurrent `PATCH` decision requests on the same application → exactly one succeeds, the other
  receives a conflict.
- An underwriter attempts to approve an application already in `DISBURSED` → `InvalidApplicationStateException`,
  no state change.
- The state update and the `DecisionRecord` insert happen inside a single Mongo transaction — if either
  fails, neither is persisted.

## Out of Scope
Disbursement execution itself (`specs/disbursement_spec.md`) — approval only marks `APPROVED`;
disbursing the funds is a separate step.
