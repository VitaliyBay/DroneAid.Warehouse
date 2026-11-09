# Design System

DroneAid Warehouse uses its own visual style, derived from the DroneAid.Barcelona
brand guide (`D:\DroneAid.Barcelona\Styles`). The brand is a poster/slide style:
blue backgrounds, yellow tiles, uppercase titles, no shadows. This app is used
daily for scanning lists and editing records, so we keep the brand identity but
make it lighter, softer, and friendlier.

## What we keep from the brand

- Colors: DroneAid Blue `#1B2796`, Yellow `#FFD92E`, Ink `#14206F`, Cream `#FBF8EC`.
- Fonts: **Exo 2** for headings, **Inter** for body (both support Latin and Cyrillic).
- Rounded shapes, yellow number badges and tiles, cream warm cards.
- The round pinwheel logo (`public/brand/droneaid-logo-circle.png`), shown on the
  blue app bar. Keep clear space of half its height; never recolor or stretch it.
- Friendly, direct, short wording (simple technical English).

## What we change, and why

| Brand guide | This app | Reason |
| --- | --- | --- |
| Blue is ~60% of the surface | Blue frames the app (app bar, hero, primary buttons); work areas are light | Long lists and forms are easier to read on light surfaces. |
| No shadows | Very soft shadows on cards and on hover | Gives gentle depth and shows what is clickable. |
| Uppercase titles | Sentence-case headings; uppercase only for hero titles and eyebrow labels | More approachable and readable at small sizes. |
| 28 px card radius on 1920 px canvas | `1.5rem` cards, `0.625rem` inputs, pill buttons | Friendly and consistent on small screens. |
| Only blue/yellow/cream | Plus one warm red-brown, reserved for problems and errors | Users must spot "Needs repair" and form errors quickly. It is always paired with a text label. |

## Where it lives

All styling is global SCSS in `src/droneaid-barcelona-web/src/styles/`:

- `_tokens.scss` — CSS custom properties (`--da-*`) for colors, type, radius, spacing, shadow, motion.
- `_base.scss` — reset, typography, focus ring, reduced-motion support.
- `_components.scss` — reusable `da-` classes: app bar, card, tile, buttons, form fields, status chips, filter chips, badges, rows, grid, empty state.

Feature components should use the tokens and `da-` classes rather than hard-coded
colors. Add a new shared class here when two screens need it.

## Principles

1. **Light surface, blue frame, yellow for one action.** Use one yellow call-to-action per screen (for example "Add drone").
2. **Never rely on color alone.** Statuses always show their text label; errors always include a message.
3. **Touch first.** Every control is at least 44 px tall; inputs use 16 px text so phones do not zoom.
4. **Mobile first.** Cards stack in one column on phones and use `da-grid` to reflow to 2–4 columns on larger screens. Breakpoints: tablet 40 rem, laptop 64 rem, desktop 90 rem. Verify each size.
5. **Calm motion.** Short 160 ms transitions; all motion is disabled for users who prefer reduced motion.
6. **Friendly copy.** Short, positive sentences; empty states say what to do next.

## Colors

| Token | Value | Use |
| --- | --- | --- |
| `--da-blue` / `--da-navy` | `#1B2796` / `#0B1A6B` | App bar, primary buttons, hover |
| `--da-yellow` | `#FFD92E` | Main call-to-action, badges, key-fact tiles |
| `--da-ink` | `#14206F` | Body text; text on yellow and cream |
| `--da-text-muted` | `#4D5688` | Secondary text (6.9:1 on white) |
| `--da-bg` / `--da-surface` | `#F4F5FB` / `#FFFFFF` | Page and card backgrounds |
| `--da-cream` | `#FBF8EC` | Warm highlights, empty states |
| `--da-focus` | `#6480F5` | Focus rings only |

### Drone status chips

| Status | Chip class | Colors |
| --- | --- | --- |
| Available | `da-status-available` | Blue text on light blue |
| In testing | `da-status-testing` | Dark amber text on soft yellow |
| Needs repair | `da-status-repair` | Dark red text on soft red |
| Unavailable | `da-status-unavailable` | Grey-blue text on light grey |

## Component quick reference

```html
<header class="da-appbar">
  <img class="da-appbar-logo" src="brand/droneaid-logo-circle.png" alt="">
  <div class="da-appbar-title">DroneAid<small>Barcelona</small></div>
</header>

<button class="da-btn da-btn-accent">Add drone</button>
<button class="da-btn da-btn-secondary">Cancel</button>

<div class="da-field">
  <label for="code">Drone code</label>
  <input id="code" class="da-input" placeholder="DABCN0001">
  <span class="da-hint">Letters and numbers, unique.</span>
</div>

<div class="da-grid">
  <article class="da-card da-card-interactive">
    <h3>Falcon</h3>
    <span class="da-status da-status-available">Available</span>
  </article>
</div>
```

## Accessibility

Ink on white is 13:1 and muted text on white is 6.9:1. Focus is shown with a
visible ring on every interactive element. Status never depends on color alone.
Re-check contrast when adding colors.

## Open decisions

- Whether to add a dark theme.
- A wordmark file (the brand guide has none yet); until then use text beside the round logo.
- Final app icon/favicon based on the pinwheel logo.
