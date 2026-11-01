---
name: review-change
description: "Review DroneAid code or documentation changes for correctness, security, responsive UX, tests, and documentation consistency before handoff."
---

# Review Change

Use this skill when asked to review a change, prepare it for handoff, or assess
readiness before merging. It reports findings; it does not edit files unless
the user separately asks for fixes.

Read `AGENTS.md`, inspect the current Git diff and recent commits, and compare
the change against its matching feature specification and architecture notes.
Focus on defects, authorization and data exposure, invalid workflow changes,
database persistence, error handling, responsive and keyboard use, and missing
or misleading documentation.

Verify that feature behavior changes update `docs/features/`, architecture
changes update `docs/architecture/`, and `docs/TODO.md` reflects completed or
new work. Check relevant build or test evidence; run safe checks when needed.
Report findings first, ordered by severity with file references, then list
remaining validation and a concise summary. Do not invent issues where the
evidence is inconclusive.
