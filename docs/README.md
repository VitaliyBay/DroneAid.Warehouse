# Documentation

This directory holds the product documentation for DroneAid Warehouse.

- [Project intent](PROJECT_INTENT.md) describes the mission, lifecycle, users,
  and initial scope.
- [Repository to-do](TODO.md) is the living checklist of product decisions,
  implementation work, and operational readiness tasks.
- [Architecture](architecture/README.md) defines the Angular, ASP.NET Core,
  PostgreSQL, Docker, and hosting approach.
- [Identification and access](features/identification-and-access.md) defines
  authentication, roles, and permissions.
- [Drone build tracking](features/drone-build-tracking.md) defines the central
  drone record, lifecycle, and status-transition rules.
- [Component inventory and requests](features/component-inventory-and-requests.md)
  defines stock, replenishment, and allocation to a drone build.
- [Assembly guidance and issues](features/assembly-guidance-and-issues.md) defines
  build instructions and mentor-led correction workflows.

Architecture documentation belongs in `architecture/`; feature specifications
belong in `features/`, with one lowercase hyphenated Markdown file per feature.

Use descriptive lowercase file names with hyphens, for example
`features/component-requesting.md` or `features/flight-test-records.md`.
