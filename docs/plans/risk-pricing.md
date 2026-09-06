# Execution Plan — Risk-Based Pricing

## Title
Risk-Based Pricing (AC-04)

## Date
2026-09-06

## Status
Done

## Goal
Given an application and its eligibility-derived credit score, assign an interest-rate band and
compute a fixed-point EMI offer, then persist that offer for later retrieval.

## Touched Files
- `specs/risk_pricing_spec.md` (already committed)
- `src/api/src/modules/pricing/config/rate-bands.config.ts`
- `src/api/src/modules/pricing/schema/offer.schema.ts`
- `src/api/src/modules/pricing/repository/pricing.repository.ts`
- `src/api/src/modules/pricing/service/pricing.service.ts`
- `src/api/src/modules/pricing/pricing.module.ts`
- `src/api/src/modules/pricing/service/pricing.service.spec.ts`

## Order of Operations
1. Define `RATE_BANDS` as a descending-by-threshold array so the first matching band wins (highest
   threshold the score clears).
2. Define the `Offer` schema (`applicationId`, `rateBandLabel`, `annualRate`, `emi`, `tenureMonths`,
   `totalPayable`) — a new `offers` collection, not mixed into `Application`.
3. `PricingService.assignRateBand(score)` — pure function over `RATE_BANDS`.
4. `PricingService.computeEmi(principal, annualRate, tenureMonths)` — implements the formula from
   `.claude/skills/emi-calculator/SKILL.md` verbatim, `Decimal` throughout.
5. `PricingService.priceApplication(applicationId, creditScore)` — loads the application via
   `IntakeService.findById`, assigns the band, computes EMI and total payable, persists the `Offer`,
   and returns it. `creditScore` is passed in by the caller (the underwriting orchestration built in
   step8) rather than looked up here — pricing does not depend on eligibility's repository or service.
6. Unit tests against `PricingService` with a fake `IntakeService` and an in-memory `PricingRepository`
   double, plus a randomized property check across 1000 principal/rate/tenure combinations asserting
   the result string never contains floating-point artifacts (e.g. trailing `.30000000000000004`-style
   noise) and always has exactly 2 decimal places.

## Tests
- `AC-04`: "assigns the correct rate band for a high credit score"
- `AC-04`: "assigns the correct rate band for a low credit score"
- `AC-04`: "computes EMI in fixed-point matching a known reference value"
- `AC-04`: "never produces a floating-point rounding artifact across 1000 randomized inputs"

## Open Questions
- `totalPayable` is `emi * tenureMonths` (undiscounted sum of installments), not a true amortized total
  accounting for compounding nuances — acceptable simplification for this scope.

## Risks
- No automated lint rule blocks stray `Number`/`parseFloat` use on money fields yet (NFR-05's
  dependency-cruiser rule, added in step11, checks module boundaries, not numeric types) — mitigated by
  code review discipline now and the AC coverage audit in step12 double-checking for `Number(`/
  `parseFloat(` on money-shaped variables in this module.
