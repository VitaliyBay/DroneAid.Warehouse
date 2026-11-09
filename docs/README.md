# Documentation

This directory holds the product documentation for DroneAid Warehouse.

- [Project intent](PROJECT_INTENT.md) describes the mission, lifecycle, users,
  and initial scope.
- [Repository to-do](TODO.md) is the living checklist of product decisions,
  implementation work, and operational readiness tasks.
- [Claude Code skills and hooks](claude-skills.md) explains the repository-local AI
  workflows and optional Git checks.
- [Design system](architecture/design-system.md) defines the app's visual style,
  derived from the DroneAid.Barcelona brand, and where its tokens and classes live.
- [Architecture](architecture/README.md) defines the Angular, ASP.NET Core,
  PostgreSQL, Docker, and hosting approach.
- [Drone registry (MVP)](features/drone-registry-mvp.md) defines the first
  release: tracking the drones we have, with search, filters, components,
  issues, and flight-test video links. It takes precedence over the feature
  documents below, which describe post-MVP direction.
- [Identification and access](features/identification-and-access.md) defines
  authentication, roles, and permissions.
- [Drone build tracking](features/drone-build-tracking.md) defines the central
  drone record, lifecycle, and status-transition rules.
- [Component inventory and requests](features/component-inventory-and-requests.md)
  defines stock, replenishment, and allocation to a drone build.
- [Assembly guidance and issues](features/assembly-guidance-and-issues.md) defines
  build instructions and mentor-led correction workflows.
- [Quality, flight test, and delivery workflow](features/quality-flight-and-delivery.md)
  defines the required inspections, repairs, evidence links, release gate, and
  shipment records for the internal MVP.

Architecture documentation belongs in `architecture/`; feature specifications
belong in `features/`, with one lowercase hyphenated Markdown file per feature.

Use descriptive lowercase file names with hyphens, for example
`features/component-requesting.md` or `features/flight-test-records.md`.
