# Feature: Component Inventory and Requests

## Goal

Give DropAid a reliable view of the drone components it needs, has received,
has reserved, and has installed. The feature should prevent a build from
starting without essential parts and preserve traceability from donor-supported
component to the drone that uses it.

## Implemented first slice

The current application provides a component catalogue, individually traceable
stock receipts, quantity adjustments, and replenishment requests. The web
workspace lets a signed-in user add catalogue entries, record stock as
available or quarantined, see available stock by component type, and create a
request draft. The API additionally supports submitting, approving, ordering,
and partially or fully receiving a request.

Every catalogue creation, receipt, adjustment, request action, and request
receipt creates an inventory audit event containing the actor and reason. A
request keeps its original requested quantity; receipt records instead add to
its separate received quantity and create a new stock record with its own
source reference and availability state. Stock can never be adjusted below
zero.

The current login foundation is not yet a secure authorization system. The API
temporarily accepts the named actor supplied by the workspace; enforcing the
coordinator, builder, and mentor permissions below depends on the
Identification and Access feature. Drone reservations, releases, and
installations are also deferred until the supported build configurations and
drone records are implemented.

## Component catalogue and stock

Maintain a catalogue of component types used in supported drone configurations.
Each component type should include a name, category, manufacturer or model,
part number when available, unit of measure, compatibility notes, and the
minimum quantity needed per build configuration. Typical categories include
frame, flight controller, motors, electronic speed controllers, propellers,
camera, video transmitter, receiver, battery, antenna, and fasteners.

Stock is tracked as quantities, with these availability states:

| State | Meaning |
| --- | --- |
| Available | Received, inspected if required, and not reserved. |
| Reserved | Set aside for a specific drone build. |
| Installed | Recorded as used in a specific drone. |
| Quarantined | Not usable until an issue is assessed. |
| Consumed / removed | No longer available; retain the reason and history. |

Where a serial number or batch is meaningful—such as batteries, flight
controllers, or radios—the record should capture it. Consumable items may be
tracked only by quantity.

## Requests and replenishment

Authorized users create a component request when stock is insufficient for a
planned build, replacement, or repair. A request contains the component type,
quantity, reason, priority, requested-by user, related drone when applicable,
and status. Suggested request statuses are `Draft`, `Submitted`, `Approved`,
`Ordered`, `Partially received`, `Received`, `Cancelled`, and `Rejected`.

The application should show shortages against the component list for a drone.
A coordinator can approve a request, record an order reference, receive the
actual quantity, and decide whether the received components are available or
quarantined. Receipt must not silently alter the requested amount or source.

## Allocation to a drone

A coordinator or mentor reserves the required components from available stock
against a drone's build configuration. The system must prevent over-allocation,
show the allocation on both the drone and component records, and release
uninstalled reservations if a build is cancelled. During assembly, installed
components replace the reservation with an installation record. Replaced or
failed parts remain in history and should link to the relevant issue.

## Access and audit

Coordinators manage catalogue entries, stock adjustments, requests, receipts,
and allocations. Builders can view components allocated to their work; mentors
can identify replacements needed for a recorded issue. Every stock adjustment,
reservation, release, receipt, and installation records who made it and why.

## Decisions to make

Agree the initial supported build configurations, which items require serial or
batch tracking, whether supplier and purchase-price data is in scope, who may
approve purchases, stocktake frequency, and the process for donated components
that do not match the standard catalogue.
