# DroneAid Warehouse — Project Intent

## Purpose

DroneAid Warehouse will help the DropAid community coordinate the journey of a
donated drone: from funding and component preparation, through community
assembly and verification, to delivery in Ukraine. The application should make
each drone's current state, outstanding work, and recorded issues visible to
the people responsible for it.

The goal is operational traceability, not a replacement for technical training
or flight-safety procedures. The system should support the community's existing
work while creating a clear, auditable record of each drone.

## Intended lifecycle

Each drone should progress through a tracked workflow:

1. A donor funds components or a drone build, optionally identifying an
   intended recipient.
2. The team requests, receives, and allocates components to a specific drone.
3. Community members assemble the drone and can view the associated component
   list and build guidance.
4. A mentor performs quality control and records approval or required fixes.
   Issues should identify the affected component or area and the needed action,
   such as reassembly, soldering, resoldering, or replacement.
5. The drone receives a flight test. The result records pass/fail status and
   any discovered problems.
6. After successful checks, the drone is marked ready for shipment and then
   shipped to its confirmed destination.

## People and responsibilities

Likely users include donors, builders, mentors, quality-control and flight-test
staff, warehouse or logistics coordinators, and administrators. Access should
be role-aware: for example, mentors record assembly findings, testers submit
flight results, and logistics staff update shipment status.

## Information to preserve

For every drone, retain a unique identifier; component allocation; current
workflow status; assembly and inspection history; linked issues and their
resolution; flight-test outcomes; donor/recipient information appropriate for
their permissions; and shipment milestones. Track who made material
status changes and when.

## MVP scope

The first release is deliberately small: a registry of the drones the team
has. Users can see which drones are available, open one to see its status,
nickname, components, issues, and flight-test video links, create drones
manually (code, nickname, and Analog or Digital type, with components
auto-filled and editable), search by code or nickname, filter by status and
type, and edit any of that data. The lifecycle above is the long-term
direction; funding, requests, stock, assembly, QC, and shipment workflows are
deferred. See [Drone registry (MVP)](features/drone-registry-mvp.md).

## Scope to decide next

Future feature documents will define the exact workflows, fields, status rules,
permissions, notifications, reporting, and privacy requirements. Initial
candidates are component inventory and requests, drone build tracking,
assembly guidance, mentor issue reporting, quality control, flight tests,
shipment tracking, recipient confirmation, and donor-facing progress updates.
