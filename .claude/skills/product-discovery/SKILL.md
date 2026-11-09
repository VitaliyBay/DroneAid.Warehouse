---
name: product-discovery
description: "Clarify a DroneAid product idea with the user and turn the agreed scope into a feature specification and actionable follow-up work."
---

# Product Discovery

Use this skill when a feature idea is incomplete, its workflow is unclear, or
the user asks what should be built next. Do not use it when an approved feature
specification already gives enough information to implement the change.

First read `docs/PROJECT_INTENT.md`, the related feature specifications, and
`docs/TODO.md` to avoid asking for answers the repository already contains.
Ask the user only the smallest set of questions needed to make implementation
decisions. Prioritize: intended users and permissions; the happy-path workflow;
exceptions or approval rules; data that must be recorded; privacy or retention;
and what makes the feature successful. State any low-risk assumptions clearly.

Turn the agreed answers into one concise file in `docs/features/` using a
lowercase hyphenated name. Cover the goal, users, workflow, records, access,
business rules, and decisions still open. Add the document to `docs/README.md`
and update `docs/TODO.md` with work or decisions it reveals. Do not begin code
implementation unless the user asks for it after reviewing the scope.
