---
name: implement-feature
description: "Implement a documented DroneAid feature or behavior change, including tests, responsive UI work, documentation, and focused commits."
---

# Implement Feature

Use this skill when the requested work changes a DroneAid feature or introduces
new application behavior. It is not for a documentation-only proposal or an
unscoped product idea; use `$product-discovery` first in those cases.

Read `AGENTS.md`, the relevant `docs/features/` specification, and
`docs/architecture/README.md` before changing code. If no feature specification
exists, create one and add it to `docs/README.md` before implementation.

Implement the smallest complete slice that meets the documented behavior. Keep
API rules on the ASP.NET Core side, keep database access out of Angular, and
use the Docker/Caddy `/api` route rather than hard-coding a deployment host.
For user-facing work, verify the UI is usable at phone, tablet, laptop, and
desktop widths, with keyboard-accessible controls and understandable errors.

Run the relevant checks: `dotnet test DroneAid.Barcelona.sln` for API changes,
`npm run build` in `src/droneaid-barcelona-web/` for frontend changes, and
Docker verification when the stack or integration changes and Docker is
available. Update the feature specification and `docs/TODO.md` in the same
change. Make focused commits when each independently reviewable slice is
complete, and report any validation that could not be run.
