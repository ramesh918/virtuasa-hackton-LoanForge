# Business Requirements Document — LoanForge

## Background
Nord Retail Bank wants to let retail customers apply for a loan without visiting a branch or speaking
to a loan officer first. Today, applying for a personal or auto loan means paperwork, waiting on a
credit check to come back from a third party, and waiting for a human to look at the file before the
customer knows where they stand. Nord Retail Bank wants a self-serve experience where a customer can
apply online, get a fast decision wherever the rules allow it, and only wait on a human underwriter for
the cases that genuinely need judgment.

## Business Need
- Applicants should be able to apply for a loan themselves and know quickly whether they qualify, what
  it will cost them (rate, monthly payment, schedule), and what happens next.
- The bank needs consistent, policy-based eligibility and pricing decisions — the same applicant profile
  should get the same answer regardless of which day they apply or who (or what) is looking at the file.
  Judgment calls should not silently vary from one reviewer to another.
- Underwriters need a single queue of applications that genuinely require a human decision, with enough
  information to decide quickly, and a permanent record of what they decided and why.
- Once a loan is approved and the applicant accepts the offer, the money needs to reach the applicant's
  account through a controlled, trackable process — not an ad-hoc manual transfer.
- Every step of an application's life — submission, decision, payout — needs to be recorded permanently.
  If a regulator, an auditor, or an unhappy customer asks "what happened to this application and why,"
  the bank needs a complete, unaltered answer.

## Stakeholders
- **Applicant** (retail customer) — wants a fast, transparent answer and a clear view of their offer.
- **Underwriter** (bank staff) — needs a manageable queue and the information to decide confidently.
- **Bank admin / compliance** — needs assurance that decisions follow policy and that the record of what
  happened cannot be quietly changed after the fact.

## Success Looks Like
- An applicant can apply and track the status of their application without calling the bank.
- Every decision — whether made automatically by policy or by an underwriter — is explainable: there is
  always a clear reason on record for why an application was approved, declined, or sent for review.
- No applicant is ever paid out twice for the same approved loan, even if something goes wrong and the
  same request is submitted more than once.
- No applicant can see or act on another applicant's application.
- Nothing sensitive about an applicant (their income, their account details) ends up somewhere it
  shouldn't, like a plain support log.

## Out of Scope
This effort does not need to include: connecting to a real credit bureau, real identity/KYC verification,
moving real money through a real payment network, chasing repayment after a loan is disbursed, or
producing regulatory filings. All of those touchpoints are represented by a stand-in in this phase of the
work so that the lending decision process itself can be built and proven first.
