# Prompt: Pre-Merge Review

Use when: a feature branch has code + tests and is ready to merge back into its integration branch.

---
Diff `{{branch}}` against `{{base}}`. Check: (1) every AC-NN referenced in
`specs/{{feature}}_spec.md` has at least one matching test with that id in its name/comment;
(2) no floating-point arithmetic on money fields — Decimal only; (3) no PII fields passed to
console.log/Logger without redact(); (4) module boundaries respected (controller -> service ->
repository, no reverse calls). Report each check as PASS/FAIL with file:line evidence. Do not merge
yourself — report only.
---

Example invocation: "Use docs/prompts/review-merge.md on feature/eligibility against feature-1 before I merge it."
