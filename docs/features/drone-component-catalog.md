# Feature: Drone component catalog (Analog and Digital)

> **Status: implemented.** The lists below are what a new drone is filled with
> (`GET /api/drones/default-components/{type}`). Source:
> `DroneBuildConfigurations.cs`, based on proforma invoice **PI2026002821**
> (PARTIZAN SECURITY s.r.o., issued 24.09.2026, 4 drones: 2 Digital + 2 Analog).

## Rules

- Each entry has a generic **name** (stable, used for grouping and by the
  [drone visualization](drone-visualization.md)) and a **detail** note with the
  model and supplier SKU.
- Existing drones keep their own lists; only new drones, and a type change that
  chooses "replace with defaults", use these lists.
- The invoice shows quantities for four drones; the per-drone quantities below
  are the invoice quantity divided by the number of drones that use the part.

## Shared by both types

| Name | Qty | Model (SKU) |
| --- | --- | --- |
| Frame | 1 | Pilotix PT10 V3 frame (5769) |
| Flight controller | 1 | Pilotix F405 V3, Stack DIY Kit (5201) |
| Electronic speed controller | 1 | Pilotix 60A V1.0 4-in-1, Stack DIY Kit (5201) |
| Motor | 4 | Pilotix 3115 900KV (5193) |
| Propeller | 4 | HQProp LR 3-blade 10", 2 CCW + 2 CW (LR10X5X3B-GRN/2) |
| Battery | 1 | Not on the invoice; model to be decided |
| Fasteners | 1 | Not on the invoice |

The stack kit contains the flight controller and a single 60A four-in-one ESC,
so the ESC quantity is 1 (it was 4 before the invoice models were applied).

## Digital drone adds

| Name | Qty | Model (SKU) |
| --- | --- | --- |
| Digital video unit | 1 | Walksnail Avatar GT Kit, VTX + camera (WN12-2W14B) |
| Receiver | 1 | Radiomaster BR4 Dual Band Xross Gemini ExpressLRS (HP0157.0086) |
| Antenna | 2 | Maple Wireless 4.85-6.3G 2dBi omnidirectional LHCP, SMA male (7995) |

## Analog drone adds

| Name | Qty | Model (SKU) |
| --- | --- | --- |
| Analog camera | 1 | Pilotix P6 Pro (6577) |
| Analog video transmitter | 1 | Pilotix VTX 4.9-6.2G 3.0W (5226) |
| Receiver | 1 | Pilotix ELRS915 diversity, 2 antennas, PNP (5202) |
| Antenna | 1 | Pilotix Lollipop 5.8G SMA RHCP 160mm (4236) |
| MMCX to SMA adapter cable | 1 | Foxeer (5199) |
| VTX pigtail cable | 1 | Pilotix pigtail for VTX, 10cm (7559) |

## On the invoice but not in the default lists

| Item | Invoice qty | Why it is not a default |
| --- | --- | --- |
| Emax ES3054 metal-gear servo kit (0102073003) | 2 | Not needed on every drone (for example a payload release); add it per drone. |
| HGLRC M100pro GPS module (6565) | 1 | One unit for four drones; add it per drone. |

The [visualization](drone-visualization.md) draws both parts when they are in a
drone's component list.

## Decisions to make

- Confirm that the servo kit and GPS belong on specific drones only, and which.
- Choose the standard battery model and add it to the lists.
- Confirm that the HQProp quantity (4 packs on the invoice) means one
  four-propeller set per drone.
