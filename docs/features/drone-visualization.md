# Feature: Drone visualization

> **Status: implemented** on the drone detail page, below the header and above
> the components card. Part of the [drone registry](drone-registry-mvp.md).

## Goal

Let a user see a drone as a drone, not only as a list: where each part sits,
which model it is, and which expected parts are missing. Digital and Analog
drones look different because their video chain differs (see the
[component catalog](drone-component-catalog.md)).

## What the user sees

- A top-view schematic (front at the top) laid out like a labelled parts sheet:
  every part has a **text label with a leader line** in the left or right
  margin (for example "Motors ×4", "Flight controller", "Digital video unit").
  Below it is a **parts list** with each component's name, quantity, and model
  note.
- On phones (below 48rem) the margin labels would be too small, so the diagram
  uses compact **numbered markers** that match numbers in the parts list.
- **Digital drone:** frame, flight controller, ESC, motors, propellers,
  battery, Radiomaster BR4 ExpressLRS receiver, Walksnail Avatar GT kit (camera
  at the front, VTX at the rear), and two LHCP antennas at the rear.
- **Analog drone:** the same airframe, plus the P6 Pro camera, the 3W VTX, the
  ELRS915 diversity receiver, the Lollipop antenna, and the MMCX-to-SMA adapter
  and pigtail cables.
- Optional parts, when in the component list, are drawn too: GPS module and
  servo.
- Selecting a part (click, tap, or Enter/Space on a focused marker or row)
  highlights it (label, leader line, and list row) and shows its model under the
  diagram. Hovering or focusing previews the same highlight.

## Rules

- **Parts come from the drone's own component list**, so editing the list
  changes the diagram. Components are free text; a component is matched to a
  diagram position by keywords in its name (for example "motor", "receiver",
  "camera", "antenna"; see `core/drone-parts.ts`). Default names always match.
- **Missing parts:** if the drone's type expects a part (frame, flight
  controller, ESC, motors, propellers, battery, receiver, and the type's video
  parts and antenna) and the list has none, it is drawn as a dashed outline and
  the row is marked "Not in list".
- **Open issues:** a part whose component name equals the component named by an
  open issue (case-insensitive) is marked "Open issue" with a warning label and
  a red marker. Resolved issues do not flag.
- **Not drawn:** fasteners and any component that matches no part are listed
  under "Other components (not drawn)" so nothing is hidden.
- The drawing shows one marker per part type (for example one "Motors" marker
  for four motors); quantity is in the list. The antenna drawing uses one
  antenna for a total quantity of 1 and two for 2 or more.
- The diagram is a schematic, not a scale drawing.

## Accessibility and responsive behavior

- Every part (label or marker) is a keyboard-focusable button with a text label that names the
  part, its model, and any issue or missing state. Status is never shown by
  colour alone: missing parts use dashed outlines and a "Not in list" label;
  issues use a warning label.
- The diagram is full width above the parts list (maximum 48rem); the list is
  one column on phones and two columns from 48rem. The diagram scales to its
  container. Checked at phone (375 px),
  tablet (768 px), and laptop (1366 px) widths with no horizontal scrolling.
- All texts, including part names, are translated (see
  [Localization](localization.md)); model notes are user data.

## Out of scope

- Editing components by clicking the diagram (use the components card).
- Per-unit state, such as which of four motors has an issue.
- A side or 3D view, and drawing the video cables in detail.

## Decisions to make

- Whether free-text matching is enough, or components should get an explicit
  "position" field chosen by the user (more reliable for custom names, but
  needs an API and database change).
- Whether GPS and servo belong in the default lists (see the catalog).
