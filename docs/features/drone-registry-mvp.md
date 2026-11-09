# Feature: Drone Registry (MVP)

> **Status: implemented.** API: `api/drones` (see below). UI: list, detail,
> add/edit form. Seeded sign-in is unchanged.

## Goal

The first release does one thing: let the team keep track of the drones it
has. Users can see which drones are available, open any drone to see its
status, nickname, components, known issues, and flight-test videos, and keep
that information up to date. Everything else in the wider project vision
(donations, requests, stock, assembly workflow, quality gates, shipment) is out
of scope until this registry is in use.

## Scope

In scope:

- create a drone manually from a code, nickname, and drone type;
- list drones with search and filters;
- view a drone's detail page;
- edit a drone's data, status, components, issues, and video links.

Out of scope for the MVP (see the other feature documents for the long-term
plan): the status-transition workflow and approvals, donor and recipient data,
component stock and requests, QR scanning, assembly guides, QC checklists,
shipment tracking, notifications, and reporting. The component inventory and
request screens already built remain in the codebase but are not part of the
MVP experience.

## Drone record

| Field | Rules |
| --- | --- |
| Code | Required, unique, entered manually (for example `DABCN0001`). Compared case-insensitively. May be edited later; uniqueness is re-checked. |
| Nickname | Required, free text. Need not be unique, but the form warns about duplicates. |
| Type | Required: `Analog` or `Digital`. Drives the default component list. |
| Status | One of the MVP statuses below. |
| Components | List of component entries, auto-loaded from the type and editable. |
| Issues | Zero or more issue records. |
| Flight-test videos | Zero or more links to cloud-stored videos. |
| Created / last updated | Set by the system. |

### Statuses

Statuses are set directly by the user, with no enforced transitions:

| Status | Meaning |
| --- | --- |
| Available | Working and ready to be used or shipped. |
| In testing | Currently being flight-tested or checked. |
| Needs repair | Has at least one problem to fix before it can be used. |
| Unavailable | Not usable now (for example in transit, lost, or retired). |

A new drone starts as `Available` unless the user selects another status.
Changing a status records the date. The status list is deliberately small and
is an open decision (see below).

### Components

When a drone is created, its component list is filled in from the chosen type
and can then be changed freely for that drone. Changing the type of an existing
drone asks whether to replace the component list with the new type's defaults
or keep the current one.

Default lists follow the standard configurations already defined in the
inventory feature:

- **Shared by both types:** frame, flight controller, motors, electronic speed
  controllers, propellers, receiver, battery, antenna, fasteners.
- **Analog adds:** analog camera and video transmitter.
- **Digital adds:** digital video unit.

Each component entry holds a name, an optional model or detail note, and a
quantity. Users can add, edit, and remove entries on a single drone without
affecting the defaults or other drones. Editing the default lists per type is
not part of the MVP.

### Issues

An issue is a short record of a problem with a drone: title, optional
description, optional affected component, status (`Open` or `Resolved`), the
date it was reported, and the date it was resolved. Issues are never deleted,
so the history stays visible; a mistaken entry can be edited. A drone with open
issues is flagged in the list. Setting or clearing `Needs repair` is left to
the user and is not automatic.

### Flight-test videos

A video entry is a link to a video stored in OneDrive or a similar cloud
service, with an optional label and date. The application stores and opens the
link only; it does not upload, host, or check the video. Links must be valid
`https` URLs and open in a new tab. Access to the underlying file is controlled
by the cloud provider. A link can be edited or removed (removing deletes only
the link, never the video).

## API

| Method and path | Purpose |
| --- | --- |
| `GET /api/drones?search=&status=&type=` | List drones (available first), with open-issue and video counts. |
| `GET /api/drones/summary` | Counts per status for the list header. |
| `GET /api/drones/default-components/{type}` | Standard components for `Analog` or `Digital`. |
| `GET /api/drones/{id}` | Drone with components, issues, and videos. |
| `POST /api/drones` | Create; components default from the type when omitted. |
| `PUT /api/drones/{id}` | Edit code, nickname, type, status. |
| `PUT /api/drones/{id}/components` | Replace the drone's component list. |
| `POST/PUT /api/drones/{id}/issues[/{issueId}]` | Report or edit an issue (including resolving). |
| `POST/PUT/DELETE /api/drones/{id}/videos[/{videoId}]` | Add, edit, or remove a video link. |

Errors return `{ "message": "..." }` with 400 (invalid), 404 (not found), or
409 (duplicate code). Enums are sent as text (`InTesting`, `NeedsRepair`).

## Workflow

1. The user selects **Add drone** and enters the code, nickname, and type.
2. The application shows the type's default components; the user may adjust
   them before or after saving.
3. The drone appears in the list. The user can open it to review or update any
   part of the record.
4. Issues and video links are added from the detail page as work happens.

## List, search, and filters

- The list shows code, nickname, type, status, and an open-issue indicator.
- A single search box matches drone code or nickname, case-insensitively and
  by partial text.
- Filters for status and type combine with each other and with the search.
- The list opens with all drones, available drones first, so the question
  "what do we have available?" is answered immediately. Results page or scroll
  sensibly as the fleet grows.
- Selecting a row opens the detail page; the detail page has an edit action
  for every section.

## Permissions

Any signed-in user may view and edit drones for the MVP. The existing login is
required. Role-based permissions and an audit trail are deferred; until then
the record shows only when it was last updated.

## Validation and rules

- Code and nickname cannot be blank; code must be unique.
- Type must be `Analog` or `Digital`.
- Component quantities must be whole numbers of at least one.
- Video links must be `https` URLs.
- Drones are not deleted in the MVP; use `Unavailable` instead, so records and
  links are preserved.

## Responsive behavior

The list, filters, forms, and detail page must work on smartphones, tablets,
laptops, and desktops. On narrow screens the list becomes stacked cards,
filters collapse into a compact control, and forms use a single column.
Layouts are verified at each of those sizes.

## Acceptance criteria

- A user can create a drone with only code, nickname, and type, and sees the
  correct default components.
- Creating a drone with an existing code is rejected with a clear message.
- Searching by part of a code or nickname finds the drone; status and type
  filters narrow the results and can be cleared.
- The detail page shows status, nickname, components, issues, and video links,
  and each can be edited and saved.
- Video links open the cloud-storage page in a new tab.
- All of the above work on phone, tablet, laptop, and desktop widths.

## Decisions to make

- Confirm the status list and names above.
- Code is currently editable after creation; confirm or lock it.
- Choose the standard cloud provider and sharing permissions for flight videos.
- Decide when to add roles, an audit trail, QR scanning, and the wider
  build-tracking workflow.
