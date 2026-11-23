import { Component, computed, DestroyRef, inject, input, signal } from '@angular/core';

import { mapParts, PART_SLOTS, PartGroup, PartSlot } from '../core/drone-parts';
import { DroneComponent, DroneDetail } from '../core/models';
import { I18nService } from '../i18n/i18n.service';

interface DiagramEntry {
  slot: PartSlot;
  number: number;
  /** Null when the drone type expects the part but the drone's list lacks it. */
  group: PartGroup | null;
}

// Marker (numbered badge) position per slot, in the 440 x 446 diagram space.
const MARKERS: Record<PartSlot, [number, number]> = {
  frame: [152, 128],
  flightController: [176, 176],
  esc: [252, 204],
  motor: [112, 112],
  propeller: [44, 44],
  battery: [264, 136],
  receiver: [166, 254],
  videoUnit: [244, 258],
  camera: [244, 106],
  vtx: [244, 258],
  antenna: [270, 394],
  adapter: [192, 322],
  pigtail: [190, 290],
  gps: [338, 206],
  servo: [106, 206],
  fasteners: [0, 0]
};

// Wide layout: each part gets a text label in the left or right margin joined to the part by a
// leader line, like a labelled parts sheet. ax/ay is where the line touches the drawing.
interface Callout {
  side: 'l' | 'r';
  y: number;
  ax: number;
  ay: number;
}

const CALLOUTS: Record<PartSlot, Callout> = {
  propeller: { side: 'l', y: 40, ax: 56, ay: 56 },
  frame: { side: 'l', y: 100, ax: 160, ay: 150 },
  flightController: { side: 'l', y: 160, ax: 176, ay: 200 },
  servo: { side: 'l', y: 215, ax: 104, ay: 220 },
  receiver: { side: 'l', y: 272, ax: 166, ay: 264 },
  pigtail: { side: 'l', y: 322, ax: 200, ay: 298 },
  adapter: { side: 'l', y: 366, ax: 214, ay: 316 },
  camera: { side: 'r', y: 62, ax: 234, ay: 108 },
  battery: { side: 'r', y: 108, ax: 262, ay: 151 },
  motor: { side: 'r', y: 150, ax: 362, ay: 100 },
  esc: { side: 'r', y: 194, ax: 246, ay: 226 },
  gps: { side: 'r', y: 238, ax: 335, ay: 220 },
  videoUnit: { side: 'r', y: 288, ax: 238, ay: 270 },
  vtx: { side: 'r', y: 288, ax: 238, ay: 270 },
  antenna: { side: 'r', y: 392, ax: 0, ay: 392 },
  fasteners: { side: 'r', y: 0, ax: 0, ay: 0 }
};

const CORNERS = [
  { x: 90, y: 90 },
  { x: 350, y: 90 },
  { x: 90, y: 350 },
  { x: 350, y: 350 }
];

/** Top-view schematic of a drone built from its component list, with a numbered parts list beside it. */
@Component({
  selector: 'app-drone-diagram',
  template: `
    <div class="diagram">
      <figure class="figure">
        <svg
          [attr.viewBox]="narrow() ? '0 0 440 446' : '-170 0 780 446'"
          role="group"
          [attr.aria-label]="i18n.t('diagram.svgLabel', { type: i18n.t('type.' + drone().type), code: drone().code, n: entries().length })"
        >
          <text class="dir" x="220" y="14" text-anchor="middle">▲ {{ i18n.t('diagram.front') }}</text>
          <text class="dir" x="220" y="440" text-anchor="middle">{{ i18n.t('diagram.rear') }}</text>

          @for (entry of paintOrder(); track entry.slot) {
            <g
              class="part"
              role="button"
              tabindex="0"
              [class.is-on]="highlight() === entry.slot"
              [class.is-missing]="!entry.group"
              [class.has-issue]="entry.group?.hasOpenIssue"
              [attr.aria-pressed]="selected() === entry.slot"
              [attr.aria-label]="ariaLabel(entry)"
              (mouseenter)="hover.set(entry.slot)"
              (mouseleave)="hover.set(null)"
              (focus)="hover.set(entry.slot)"
              (blur)="hover.set(null)"
              (click)="toggle(entry.slot)"
              (keydown.enter)="toggle(entry.slot)"
              (keydown.space)="toggle(entry.slot); $event.preventDefault()"
            >
              @switch (entry.slot) {
                @case ('frame') {
                  @for (c of corners; track $index) {
                    <line class="arm" x1="220" y1="220" [attr.x2]="c.x" [attr.y2]="c.y" />
                  }
                  <rect class="shape" x="160" y="120" width="120" height="200" rx="16" />
                }
                @case ('flightController') {
                  <rect class="shape" x="176" y="176" width="46" height="46" rx="4" />
                  <circle class="dot" cx="184" cy="184" r="2" />
                  <circle class="dot" cx="214" cy="184" r="2" />
                  <circle class="dot" cx="184" cy="214" r="2" />
                }
                @case ('esc') {
                  <rect class="shape" x="200" y="200" width="46" height="46" rx="4" />
                  <circle class="dot" cx="238" cy="238" r="2" />
                  <circle class="dot" cx="238" cy="208" r="2" />
                  <circle class="dot" cx="208" cy="238" r="2" />
                }
                @case ('motor') {
                  @for (c of corners; track $index) {
                    <circle class="shape" [attr.cx]="c.x" [attr.cy]="c.y" r="15" />
                    <circle class="dot" [attr.cx]="c.x" [attr.cy]="c.y" r="4" />
                  }
                }
                @case ('propeller') {
                  @for (c of corners; track $index) {
                    <g [attr.transform]="'translate(' + c.x + ' ' + c.y + ')'">
                      <circle class="prop" r="66" />
                      <ellipse class="blade" cy="-34" rx="12" ry="28" />
                      <ellipse class="blade" cy="-34" rx="12" ry="28" transform="rotate(120)" />
                      <ellipse class="blade" cy="-34" rx="12" ry="28" transform="rotate(240)" />
                    </g>
                  }
                }
                @case ('battery') {
                  <rect class="shape" x="178" y="134" width="84" height="34" rx="6" />
                  <line class="stroke" x1="262" y1="151" x2="272" y2="151" />
                }
                @case ('receiver') {
                  <line class="stroke" x1="166" y1="264" x2="134" y2="302" />
                  <line class="stroke" x1="166" y1="268" x2="146" y2="314" />
                  <circle class="dot" cx="134" cy="302" r="3" />
                  <circle class="dot" cx="146" cy="314" r="3" />
                  <rect class="shape" x="166" y="256" width="26" height="16" rx="3" />
                }
                @case ('videoUnit') {
                  <line class="stroke dashed" x1="220" y1="122" x2="220" y2="256" />
                  <rect class="shape" x="206" y="98" width="28" height="24" rx="5" />
                  <circle class="dot" cx="220" cy="110" r="7" />
                  <rect class="shape" x="206" y="256" width="32" height="26" rx="4" />
                }
                @case ('camera') {
                  <rect class="shape" x="206" y="98" width="28" height="24" rx="5" />
                  <circle class="dot" cx="220" cy="110" r="7" />
                }
                @case ('vtx') {
                  <rect class="shape" x="206" y="256" width="32" height="26" rx="4" />
                }
                @case ('antenna') {
                  @for (x of antennaXs(); track $index) {
                    <line class="stroke thick" [attr.x1]="x.from" y1="282" [attr.x2]="x.to" y2="392" />
                    <circle class="shape" [attr.cx]="x.to" cy="392" r="5" />
                  }
                }
                @case ('adapter') {
                  <rect class="shape" x="214" y="300" width="12" height="22" rx="3" />
                }
                @case ('pigtail') {
                  <path class="stroke thick" d="M208 284 c-18 6 -18 18 -2 22" fill="none" />
                }
                @case ('gps') {
                  <line class="stroke thick" x1="280" y1="220" x2="310" y2="220" />
                  <circle class="shape" cx="322" cy="220" r="13" />
                  <circle class="dot" cx="322" cy="220" r="5" />
                }
                @case ('servo') {
                  <line class="stroke thick" x1="134" y1="220" x2="160" y2="220" />
                  <rect class="shape" x="104" y="208" width="30" height="24" rx="4" />
                  <circle class="dot" cx="112" cy="220" r="3" />
                }
              }
              @if (narrow()) {
                <g class="marker" [attr.transform]="markerTransform(entry.slot)">
                  <circle r="11" />
                  <text y="4" text-anchor="middle">{{ entry.number }}</text>
                </g>
              } @else {
                @let c = callout(entry.slot);
                <line class="leader" [attr.x1]="c.ax" [attr.y1]="c.ay" [attr.x2]="c.side === 'l' ? -8 : 448" [attr.y2]="c.y - 4" />
                <circle class="anchor" [attr.cx]="c.ax" [attr.cy]="c.ay" r="3.5" />
                <text class="label" [attr.x]="c.side === 'l' ? -14 : 454" [attr.y]="c.y" [attr.text-anchor]="c.side === 'l' ? 'end' : 'start'">
                  {{ calloutText(entry) }}
                </text>
              }
            </g>
          }
        </svg>
        <figcaption class="caption" aria-live="polite">
          {{ caption() }}
        </figcaption>
      </figure>

      <div class="list-wrap">
        <p class="da-hint">{{ i18n.t('diagram.hint') }}</p>
        <ol class="parts">
          @for (entry of entries(); track entry.slot) {
            <li>
              <button
                type="button"
                class="part-row"
                [class.is-on]="highlight() === entry.slot"
                [class.is-missing]="!entry.group"
                [attr.aria-pressed]="selected() === entry.slot"
                (click)="toggle(entry.slot)"
                (mouseenter)="hover.set(entry.slot)"
                (mouseleave)="hover.set(null)"
                (focus)="hover.set(entry.slot)"
                (blur)="hover.set(null)"
              >
                <span class="num" aria-hidden="true">{{ entry.number }}</span>
                <span class="row-body">
                  <span class="row-label">
                    {{ i18n.t('slot.' + entry.slot) }}
                    @if (!entry.group) {
                      <span class="da-pill">{{ i18n.t('diagram.missing') }}</span>
                    }
                    @if (entry.group?.hasOpenIssue) {
                      <span class="da-pill pill-warn">⚠ {{ i18n.t('diagram.issue') }}</span>
                    }
                  </span>
                  @for (item of entry.group?.components ?? []; track item.id) {
                    <span class="row-comp">
                      <b>{{ item.name }} × {{ item.quantity }}</b>
                      @if (item.detail) {
                        <span>{{ item.detail }}</span>
                      }
                    </span>
                  }
                </span>
              </button>
            </li>
          }
        </ol>
        @if (undrawn().length) {
          <h3>{{ i18n.t('diagram.other') }}</h3>
          <ul class="undrawn">
            @for (item of undrawn(); track item.id) {
              <li>
                <b>{{ item.name }} × {{ item.quantity }}</b>
                @if (item.detail) {
                  <span>{{ item.detail }}</span>
                }
              </li>
            }
          </ul>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .diagram {
      display: grid;
      gap: var(--da-space-5);
      grid-template-columns: minmax(0, 1fr);
    }

    @media (min-width: 48rem) {
      .parts {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    .figure {
      margin: 0;
    }

    svg {
      background: var(--da-surface-warm);
      border: 1px solid var(--da-border);
      border-radius: var(--da-radius-lg);
      display: block;
      height: auto;
      margin: 0 auto;
      max-width: 48rem;
      width: 100%;
    }

    .dir {
      fill: var(--da-text-muted);
      font-family: var(--da-font-heading);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .part {
      cursor: pointer;
      outline: none;
    }

    .shape {
      fill: var(--da-surface);
      stroke: var(--da-ink);
      stroke-width: 2;
      transition: fill var(--da-duration) var(--da-ease);
    }

    .arm {
      stroke: var(--da-border-strong);
      stroke-linecap: round;
      stroke-width: 12;
    }

    .stroke {
      fill: none;
      stroke: var(--da-ink);
      stroke-linecap: round;
      stroke-width: 2;
    }

    .stroke.thick {
      stroke-width: 3;
    }

    .stroke.dashed {
      stroke-dasharray: 4 4;
      stroke-width: 1.5;
    }

    .dot {
      fill: var(--da-ink);
    }

    .prop {
      fill: rgb(100 128 245 / 8%);
      stroke: var(--da-border-strong);
      stroke-dasharray: 3 4;
      stroke-width: 2;
    }

    .blade {
      fill: var(--da-blue-soft);
      opacity: 0.7;
    }

    .leader {
      stroke: var(--da-text-muted);
      stroke-width: 1.25;
    }

    .anchor {
      fill: var(--da-blue);
    }

    .label {
      fill: var(--da-text);
      font-family: var(--da-font-heading);
      font-size: 13.5px;
      font-weight: 700;
    }

    .is-on .leader {
      stroke: var(--da-blue);
      stroke-width: 2;
    }

    .is-on .label {
      fill: var(--da-blue);
      text-decoration: underline;
    }

    .has-issue .label {
      fill: var(--da-status-repair-fg);
    }

    .has-issue .anchor {
      fill: var(--da-status-repair-fg);
    }

    .is-missing .leader {
      stroke-dasharray: 4 3;
    }

    .is-missing .label {
      font-style: italic;
      opacity: 0.8;
    }

    .marker circle {
      fill: var(--da-blue);
      stroke: var(--da-surface);
      stroke-width: 2;
    }

    .marker text {
      fill: var(--da-text-on-blue);
      font-family: var(--da-font-heading);
      font-size: 12px;
      font-weight: 800;
      pointer-events: none;
    }

    .is-on .shape {
      fill: var(--da-yellow);
    }

    .is-on .blade {
      fill: var(--da-yellow);
      opacity: 0.9;
    }

    .is-on .arm {
      stroke: var(--da-blue-soft);
    }

    .is-on .marker circle {
      fill: var(--da-yellow);
      stroke: var(--da-ink);
    }

    .is-on .marker text {
      fill: var(--da-ink);
    }

    .part:focus-visible .marker circle {
      stroke: var(--da-focus);
      stroke-width: 4;
    }

    .is-missing .shape,
    .is-missing .stroke,
    .is-missing .arm {
      fill: none;
      stroke-dasharray: 5 4;
      stroke-width: 2;
    }

    .is-missing .shape,
    .is-missing .stroke {
      opacity: 0.65;
    }

    .is-missing .dot,
    .is-missing .blade {
      opacity: 0.35;
    }

    .is-missing .marker circle {
      fill: var(--da-surface);
      stroke: var(--da-blue);
      stroke-dasharray: 3 2;
    }

    .is-missing .marker text {
      fill: var(--da-blue);
    }

    .has-issue .marker circle {
      fill: var(--da-status-repair-fg);
    }

    .has-issue .marker text {
      fill: var(--da-surface);
    }

    .caption {
      color: var(--da-text-muted);
      font-size: var(--da-text-sm);
      margin: var(--da-space-2) auto 0;
      max-width: 40rem;
      min-height: 2.6em;
      text-align: center;
    }

    .parts {
      display: grid;
      gap: var(--da-space-2);
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .part-row {
      align-items: flex-start;
      background: var(--da-surface);
      border: 1px solid var(--da-border);
      border-radius: var(--da-radius-sm);
      color: var(--da-text);
      cursor: pointer;
      display: flex;
      font: inherit;
      gap: var(--da-space-3);
      min-height: var(--da-tap-min);
      padding: var(--da-space-2) var(--da-space-3);
      text-align: left;
      width: 100%;
    }

    .part-row:focus-visible {
      box-shadow: var(--da-focus-ring);
      outline: none;
    }

    .part-row.is-on {
      background: var(--da-surface-warm);
      border-color: var(--da-blue);
    }

    .part-row.is-missing {
      border-style: dashed;
    }

    .num {
      align-items: center;
      background: var(--da-blue);
      border-radius: 50%;
      color: var(--da-text-on-blue);
      display: inline-flex;
      flex: none;
      font-family: var(--da-font-heading);
      font-size: var(--da-text-sm);
      font-weight: 800;
      height: 1.75rem;
      justify-content: center;
      width: 1.75rem;
    }

    .part-row.is-missing .num {
      background: var(--da-surface);
      border: 2px dashed var(--da-blue);
      color: var(--da-blue);
    }

    .row-body {
      display: grid;
      gap: 2px;
      min-width: 0;
    }

    .row-label {
      align-items: center;
      display: flex;
      flex-wrap: wrap;
      font-weight: 700;
      gap: var(--da-space-2);
    }

    .row-comp {
      color: var(--da-text-muted);
      display: grid;
      font-size: var(--da-text-sm);
      overflow-wrap: anywhere;
    }

    .row-comp b {
      color: var(--da-text);
    }

    h3 {
      font-size: var(--da-text-md);
      margin: var(--da-space-5) 0 var(--da-space-2);
    }

    .undrawn {
      color: var(--da-text-muted);
      font-size: var(--da-text-sm);
      margin: 0;
      padding-left: var(--da-space-5);
    }

    .undrawn li {
      overflow-wrap: anywhere;
    }

    .undrawn b {
      color: var(--da-text);
      display: block;
    }
  `
})
export class DroneDiagramComponent {
  readonly i18n = inject(I18nService);
  readonly drone = input.required<DroneDetail>();

  readonly corners = CORNERS;
  /** Phones get compact numbered markers; wider screens get labelled callouts. */
  readonly narrow = signal(false);

  constructor() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const query = window.matchMedia('(max-width: 47.99rem)');
      const update = (event: { matches: boolean }) => this.narrow.set(event.matches);
      update(query);
      query.addEventListener('change', update);
      inject(DestroyRef).onDestroy(() => query.removeEventListener('change', update));
    }
  }
  readonly hover = signal<PartSlot | null>(null);
  readonly selected = signal<PartSlot | null>(null);
  readonly highlight = computed(() => this.hover() ?? this.selected());

  private readonly map = computed(() => mapParts(this.drone().components, this.drone().issues, this.drone().type));

  readonly entries = computed<DiagramEntry[]>(() => {
    const { groups, missing } = this.map();
    const slots = PART_SLOTS.filter(
      (slot) => slot !== 'fasteners' && (groups.some((group) => group.slot === slot) || missing.includes(slot))
    );
    return slots.map((slot, index) => ({
      slot,
      number: index + 1,
      group: groups.find((group) => group.slot === slot) ?? null
    }));
  });

  /** Components with no drawing: fasteners and anything that matches no slot. */
  readonly undrawn = computed<DroneComponent[]>(() => [
    ...(this.map().groups.find((group) => group.slot === 'fasteners')?.components ?? []),
    ...this.map().unmatched
  ]);

  readonly antennaXs = computed(() => {
    const components = this.map().groups.find((group) => group.slot === 'antenna')?.components;
    const count = components ? components.reduce((sum, item) => sum + item.quantity, 0) : 2;
    return count >= 2
      ? [
          { from: 214, to: 200 },
          { from: 230, to: 244 }
        ]
      : [{ from: 220, to: 220 }];
  });

  readonly caption = computed(() => {
    const slot = this.highlight();
    const entry = this.entries().find((item) => item.slot === slot);
    if (!entry) {
      return this.i18n.t('diagram.none');
    }
    const parts = entry.group?.components.map((item) => item.detail ?? item.name).join('; ');
    const label = `${entry.number} · ${this.i18n.t('slot.' + entry.slot)}`;
    return parts ? `${label}: ${parts}` : `${label} (${this.i18n.t('diagram.missing')})`;
  });

  /** Entries in SVG paint order: the translucent propeller discs go first so nothing hides under them. */
  readonly paintOrder = computed(() => [
    ...this.entries().filter((entry) => entry.slot === 'propeller'),
    ...this.entries().filter((entry) => entry.slot !== 'propeller')
  ]);

  callout(slot: PartSlot): Callout {
    if (slot === 'antenna') {
      const last = this.antennaXs()[this.antennaXs().length - 1];
      return { ...CALLOUTS.antenna, ax: last.to + 6 };
    }
    return CALLOUTS[slot];
  }

  calloutText(entry: DiagramEntry): string {
    const label = this.i18n.t('slot.' + entry.slot);
    const quantity = entry.group?.components.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
    return quantity > 1 ? `${label} ×${quantity}` : label;
  }

  markerTransform(slot: PartSlot): string {
    const [x, y] = slot === 'antenna' ? [this.antennaXs()[this.antennaXs().length - 1].to + 24, 392] : MARKERS[slot];
    return `translate(${x} ${y})`;
  }

  ariaLabel(entry: DiagramEntry): string {
    const label = this.i18n.t('slot.' + entry.slot);
    if (!entry.group) {
      return `${entry.number}. ${label}, ${this.i18n.t('diagram.missing')}`;
    }
    const names = entry.group.components.map((item) => item.detail ?? item.name).join('; ');
    const issue = entry.group.hasOpenIssue ? `, ${this.i18n.t('diagram.issue')}` : '';
    return `${entry.number}. ${label}: ${names}${issue}`;
  }

  toggle(slot: PartSlot): void {
    this.selected.set(this.selected() === slot ? null : slot);
  }
}
