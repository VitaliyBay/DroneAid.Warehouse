# Feature: Drone code scanning

> **Status: implemented** on the drone list. Works in the browser on Android and
> iPhone (and on laptops with a webcam); nothing to install.

## Goal

Let a person standing next to a drone find its record in seconds by scanning the
code on the drone's label, instead of typing the code.

## Workflow

1. On the drone list the user selects **Scan code** (next to the search box).
2. A full-screen scanner opens and starts the rear camera. The user points it at
   the drone's QR code or barcode.
3. When a code is read, the app looks up the drone with that exact code:
   - **Found:** the drone's detail page opens.
   - **Not found:** a notice says "No drone has the code X" with an **Add a
     drone with this code** button, which opens the add form with the code
     already filled in.
   - **Not a usable code or lookup fails:** a short message explains it; the
     user can scan again.
4. **Scan from photo** is always available in the scanner. The user takes or
   chooses a photo of the label, and the app reads the code from the image. Use it
   when the camera is blocked, missing, or the site is not on HTTPS.
5. **Close** (or the Escape key) leaves the scanner without doing anything.

## What the label holds

- The drone code itself, for example `DABCN0001` (QR code, Code 128, Code 39,
  Data Matrix, or EAN-13).
- Or a link to the drone: the code is taken from a `code` query value
  (`https://…/scan?code=DABCN0001`) or the last path segment
  (`https://…/drones/DABCN0001`).
- Surrounding spaces and extra lines are ignored. A value longer than 50
  characters or containing spaces is rejected as "not a valid drone code".
- Matching ignores letter case, like drone codes everywhere else.

## Rules

- **Camera access:** browsers allow the camera only on a secure page: HTTPS, or
  `localhost` for development. On a plain `http://` address on the local network
  the camera does not start, and the app tells the user to use **Scan from
  photo**. The [free deployment options](../architecture/free-deployment-options.md)
  provide HTTPS.
- **Permission:** the first scan asks the browser for camera permission. If it is
  denied, the message explains how to allow it and offers the photo option.
  Nothing is recorded or uploaded; images are read in the browser only.
- **iPhone:** works in Safari (iOS 14.3 or later) and in a home-screen web app
  using the same page. The video element is inline and muted, as iOS requires.
- **Decoder:** the open-source ZXing library, loaded only when the scanner opens
  so the rest of the app is not slowed down. It runs on the device.
- **API:** `GET /api/drones/by-code/{code}` returns the drone (200) or
  `drone.code.notFound` (404). See the [registry spec](drone-registry-mvp.md).
- Any signed-in user may scan, as for the rest of the MVP.

## Responsive behavior and accessibility

- The scanner is a modal dialog (`role="dialog"`) sized to the screen: full width
  with a margin on phones, capped at 32rem on larger screens. Focus moves to the
  Close button; Escape closes it.
- The button label and every message are translated (English, Ukrainian,
  Spanish, Catalan). The viewfinder frame is decorative; results are announced as
  text.

## Out of scope

- Printing or generating labels (a QR code that holds the drone code is enough
  for any label printer or online generator).
- Scanning component serial numbers or stock labels.
- Scanning from the drone detail page, or continuous scanning of many drones.
- Offline use.

## Decisions to make

- Whether to add a printable label sheet or a QR download on the drone detail
  page.
- Whether an unknown code may create a drone only for authorized users once
  roles exist (see [Identification and access](identification-and-access.md)).
