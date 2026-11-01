# Feature: Quality, Flight Test, and Delivery Workflow

## Goal

Give mentors and organizers a practical, auditable way to prove that a drone
has passed the required assembly checks and flight tests before it is released
for delivery. This MVP is an internal tool for invited team members; it does
not include donor access.

## Users and access

Mentors and quality controllers record quality-control (QC) checks, defects,
repairs, and retest decisions. Flight-test staff record flight-test evidence
and outcomes. Organizers coordinate workshops, delivery destinations, and
shipment. Administrators can correct an erroneous status only with a recorded
reason. Every material action records the acting user and time.

Donor accounts and donor-facing progress updates are explicitly deferred to the
next version. Internal records containing donor, recipient, or delivery data
remain visible only to authorized team roles.

## Workflow

The MVP uses these lifecycle statuses:

```text
Donation pending → Components to order → Waiting for components
→ Ready for workshop → Workshop scheduled → Assembly in progress
→ QC in progress → QC passed → Flight test scheduled → Flight testing
→ Ready for delivery → Shipped
```

`QC failed`, `Flight test failed`, `Repair in progress`, and `Retest required`
are exception statuses. A failure creates or links at least one defect. After
the repair is completed and a retest is required, the drone returns to QC or
flight testing as appropriate. A defect found at any later point can return the
drone to repair. The activity history must preserve every status change,
failure, repair, and approver; records are never overwritten or removed when a
drone is shipped.

## Quality control

The drone's selected type and build configuration choose the applicable,
versioned QC checklist. Every required check must record its outcome, the
person who completed it, and the time. The initial checklist covers:

- mechanical condition: fasteners, frame, component mounting, damage, and
  loose parts;
- electrical condition: secure connectors for analog builds; inspected solder
  joints, wiring, and component connections for digital builds;
- configuration: required firmware, flight-controller and ESC setup, safe
  arming without propellers, and correct motor direction.

The drone can enter `QC passed` only when every required check passes and no
blocking defect is unresolved. A failed check records or links a defect and
places the drone in `QC failed` or `Repair in progress`.

## Flight testing and evidence

Flight-test staff record two separate tests: without payload and with the
intended payload. Each result contains the date, tester, pass/fail result,
notes, and observations such as stability, vibration, abnormal sound, motor,
or control behaviour. A successful flight-test record also contains an evidence
link to a short video.

The application stores the evidence URL and useful metadata, not the video
file. The initial provider may be an organization-controlled OneDrive location
or an appropriately access-restricted video service. Evidence links must not
depend on a volunteer's personal account and must remain accessible to the
authorized team. The selected provider, access policy, retention period, and
backup procedure remain decisions to finalize before operational use.

Both tests must pass, the required evidence link must be recorded, and no
blocking defect may remain before the drone can enter `Ready for delivery`.
A failed test creates or links a defect and moves the drone to `Flight test
failed`, `Repair in progress`, or `Retest required` as appropriate.

## Defects and repairs

A defect is permanently linked to one drone and records its identifier, date
detected, detection stage, description, affected component when known,
blocking/severity flag, assignee, repair actions, repaired or replaced parts,
resolution date, retest result, notes, and supporting links. Multiple defects
may be open at once. Earlier repair notes and outcomes remain in the history
when a defect is reopened or a new defect is found.

Blocking defects prevent QC approval, flight-test approval, and delivery
readiness. Only a mentor or quality controller verifies resolution after the
required retest.

## Delivery

An organizer records the confirmed destination before moving a drone to
`Ready for delivery`. To mark it `Shipped`, the organizer records the shipping
date, shipment status, destination, tracking information when available, and
any delivery notes. Shipped drones retain their complete build, inspection,
test, defect, and shipment history.

## Decisions still open

- Select the organization-owned video/attachment provider and define access,
  retention, backup, and recovery ownership.
- Define the exact pass criteria for both flight-test conditions and the
  standard payload for each configuration.
- Finalize the first configurable QC checklists and named approval roles for
  each supported analog and digital build configuration.
- Agree shipment carriers, tracking conventions, and whether receipt
  confirmation is needed in a later release.
