# Feature: Drone Build Tracking

## Goal

Maintain one authoritative record for every drone assembled by DropAid. The
record is the operational thread that connects component allocation, assembly,
mentor findings, quality control, flight testing, and delivery. It must show a
drone's present stage, accountable people, and complete history.

## Drone record

Each drone receives a permanent, unique identifier, for example
`DA-2026-0001`. Its record should contain:

- model or build type and configuration;
- current status and the date it entered that status;
- associated donation or funding reference, when applicable;
- allocated components and their availability;
- assigned builder, mentor, and relevant coordinator;
- assembly progress, open issues, inspection results, and flight-test result;
- intended recipient and shipment/receipt information, subject to permissions;
- a time-stamped activity history showing who made each material change.

## Initial workflow

The first release should use these statuses:

```text
Planned → Awaiting components → In assembly → Needs correction
       → Quality control → Flight test → Ready to ship
       → Shipped → Received
```

`Needs correction` may be entered from assembly, quality control, or flight
test when work must be redone. Once the required issues are resolved, the
drone returns to the appropriate check: quality control after assembly-related
corrections, or flight test after test-related corrections. A cancelled or
retired state should retain the record and state a reason; it must not erase
history.

## Status transition rules

| Transition | Who may make it | Required condition |
| --- | --- | --- |
| Planned → Awaiting components | Coordinator | Drone record and build configuration exist. |
| Awaiting components → In assembly | Coordinator or mentor | Required components are allocated and available. |
| In assembly → Quality control | Builder or mentor | Assembly is marked complete and no known assembly task remains. |
| Quality control → Flight test | Mentor / quality controller | Quality control passes with no unresolved blocking issue. |
| Flight test → Ready to ship | Flight-test staff | Flight test passes and no blocking issue remains. |
| Ready to ship → Shipped | Logistics coordinator | Shipment details are recorded. |
| Shipped → Received | Logistics coordinator | Receipt is confirmed. |

The application must prevent skipped transitions and require a reason whenever
a drone moves to `Needs correction`, is cancelled, or is retired. Administrators
may correct an erroneous status only with a recorded reason.

## Views and actions

Users need a searchable list of drones, filters by status and assignment, and a
detail page containing the current state, checklist, components, issues, and
activity timeline. Builders update assembly progress; mentors record findings
and quality decisions; flight-test staff record test outcomes; logistics staff
record shipment and receipt milestones. Each role can see only data permitted
by the Identification and Access feature.

## Decisions to make

Agree the final list of drone models/configurations, whether components may be
substituted after allocation, which statuses require a named approver, the
meaning of a partial or failed flight test, and how to handle drones split,
reworked, or combined into another build.
