# Prompt: Intent → Execution Plan

Use when: you have a spec (`specs/<feature>_spec.md`) and need `docs/plans/<feature>.md`.

---
Read `specs/{{feature}}_spec.md` and `specs/app_spec.md` for context. Produce
`docs/plans/{{feature}}.md` with exactly these sections: Title, Date, Status, Goal, Touched Files, Order
of Operations, Tests, Open Questions, Risks. In the Tests section, list one test per AC-NN in the spec,
naming the file and describing the assertion. Do not write any implementation code — plan only.
---

Example invocation: "Use docs/prompts/intent-to-plan.md for the eligibility feature."
