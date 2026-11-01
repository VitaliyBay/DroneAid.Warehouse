# Feature: Drone Build Tracking

## Goal

Maintain one authoritative record for every drone assembled by DroneAid. The
record is the operational thread that connects component allocation, assembly,
mentor findings, quality control, flight testing, and delivery. It must show a
drone's present stage, accountable people, and complete history.

## Drone record

Each drone receives a permanent, unique identifier, for example
`DABCN0001`. Its QR code value is that identifier; scanning it opens the
matching drone record. When an authorized organizer or mentor scans an unknown
value, the application offers creation of a new drone record with that value.
Its record should contain:

- model or build type and configuration;
- current status and the date it entered that status;
- associated donation or funding reference, when applicable;
- allocated components and their availability;
- assigned builder, mentor, and relevant coordinator;
- assembly progress, open issues, inspection results, and flight-test result;
- intended recipient and shipment information, subject to permissions;
- a time-stamped activity history showing who made each material change.

## MVP workflow

The first release uses these statuses:

```text
Donation pending → Components to order → Waiting for components
→ Ready for workshop → Workshop scheduled → Assembly in progress
→ QC in progress → QC passed → Flight test scheduled → Flight testing
→ Ready for delivery → Shipped
```

`QC failed`, `Flight test failed`, `Repair in progress`, and `Retest required`
are exception statuses. A failure requires a linked defect. After the repair,
the drone returns to the appropriate check: quality control after an
assembly-related correction or flight testing after a test-related correction.
A cancelled or retired state should retain the record and state a reason; it
must not erase history.

## Status transition rules

| Transition | Who may make it | Required condition |
| --- | --- | --- |
| Donation pending → Components to order | Organizer | Donation or other funding is confirmed; the drone record and build configuration exist. |
| Components to order → Waiting for components | Coordinator | Required component requests or orders are recorded. |
| Waiting for components → Ready for workshop | Coordinator or mentor | Required components are allocated and available. |
| Ready for workshop → Workshop scheduled | Organizer | Workshop date is recorded. |
| Workshop scheduled → Assembly in progress | Builder or mentor | The scheduled workshop has begun. |
| Assembly in progress → QC in progress | Builder or mentor | Assembly is complete and no known assembly task remains. |
| QC in progress → QC passed | Mentor / quality controller | Every required QC check passes and no blocking defect remains. |
| QC passed → Flight test scheduled | Mentor, quality controller, or organizer | A flight test has been planned. |
| Flight test scheduled → Flight testing | Flight-test staff | The scheduled test has begun. |
| Flight testing → Ready for delivery | Flight-test staff | Both required tests pass, a video link is recorded, and no blocking defect remains. |
| Ready for delivery → Shipped | Logistics coordinator | Confirmed destination and shipment details are recorded. |

The application must prevent skipped normal transitions and require a reason
whenever a drone enters `QC failed`, `Flight test failed`, `Repair in progress`,
`Retest required`, is cancelled, or is retired. Administrators may correct an
erroneous status only with a recorded reason.

## Views and actions

Users need a searchable list of drones, filters by status and assignment, and a
detail page containing the current state, checklist, components, issues, and
activity timeline. Builders update assembly progress; mentors record findings
and quality decisions; flight-test staff record test outcomes; logistics staff
record shipment milestones. Each role can see only data permitted
by the Identification and Access feature. QR scanning must open the same drone
detail page without requiring a manual identifier lookup.

## Decisions to make

Agree the final list of drone models/configurations, whether components may be
substituted after allocation, the named approver for each checklist, exact
flight-test criteria, and how to handle drones split, reworked, or combined
into another build.
