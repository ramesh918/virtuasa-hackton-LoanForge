# Prompt: BRD/Root-Spec → Feature Spec

Use when: the root spec (`specs/app_spec.md`) names a capability that has no per-feature spec yet.

---
Read `docs/raw/loanforge-brd.md` and `specs/app_spec.md`. Draft `specs/{{feature}}_spec.md` with
sections: Overview, Acceptance Criteria (continue AC-NN numbering from `app_spec.md`, do not renumber
existing ACs), Edge Cases, Out of Scope. Cross-check every AC you add against `specs/app_spec.md`'s
Acceptance Criteria table so identifiers stay stable across specs and tests.
---

Example invocation: "Use docs/prompts/draft-spec.md for the disbursement capability."
