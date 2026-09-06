# TDD Worked Example — Tenure Validation (AC-01)

Most of LoanForge's tests were written test-after (spec and plan first, then implementation and its
test together) — that's an honest description of this build, not literal red-green-refactor. This one
example is a real, live TDD cycle run during step 17: `specs/risk_pricing_spec.md`'s edge cases say
"Tenure of 0 or negative is not re-validated here — intake (AC-01) is responsible for rejecting an
invalid tenure before an application ever reaches pricing" — but `IntakeService` never actually
implemented that check. This closes the gap test-first.

## Red
Added to `src/api/src/modules/intake/service/intake.service.spec.ts`:
```typescript
it('rejects an application with a non-positive tenure [AC-01]', async () => {
  const repository = new FakeIntakeRepository();
  const service = new IntakeService(repository);

  await expect(service.submit({ ...validDto, tenureMonths: 0 })).rejects.toBeInstanceOf(
    InvalidTenureException,
  );
  await expect(service.submit({ ...validDto, tenureMonths: -3 })).rejects.toBeInstanceOf(
    InvalidTenureException,
  );
});
```
Ran `npm test --workspace=src/api -- intake.service.spec` before writing any implementation —
failed, because `IntakeService.submit` had no tenure check at all and `InvalidTenureException` didn't
exist yet:
```
- Expected
+ Received
- Error { "message": "rejected promise" }
+ { ...application, "tenureMonths": 0, "state": "SUBMITTED" }
```

## Green
Added `InvalidTenureException` to `src/api/src/domain/exceptions.ts`, then the minimal check in
`IntakeService.submit`:
```typescript
if (dto.tenureMonths <= 0) {
  throw new InvalidTenureException(dto.tenureMonths);
}
```
Reran the same test — passed. Full suite: 47/47.

## Refactor
None needed. The check is one line with exactly one caller (`IntakeService.submit`) — extracting it
into a shared domain predicate now, with no second consumer, would be a premature abstraction rather
than a real refactor. If pricing or another module ever needs the same rule, that's the point to pull it
out, not before.
