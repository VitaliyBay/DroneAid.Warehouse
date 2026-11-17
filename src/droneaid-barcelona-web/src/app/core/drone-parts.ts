import { DroneComponent, DroneIssue, DroneType } from './models';

/** Positions on the drone diagram that a component can occupy. */
export type PartSlot =
  | 'frame'
  | 'flightController'
  | 'esc'
  | 'motor'
  | 'propeller'
  | 'camera'
  | 'videoUnit'
  | 'vtx'
  | 'antenna'
  | 'receiver'
  | 'adapter'
  | 'pigtail'
  | 'gps'
  | 'servo'
  | 'battery'
  | 'fasteners';

/** Order of the numbered markers and of the parts list. */
export const PART_SLOTS: PartSlot[] = [
  'frame',
  'flightController',
  'esc',
  'motor',
  'propeller',
  'battery',
  'receiver',
  'videoUnit',
  'camera',
  'vtx',
  'antenna',
  'adapter',
  'pigtail',
  'gps',
  'servo',
  'fasteners'
];

// Components are free text, so slots are found from the component name. More specific
// rules come first ("MMCX to SMA adapter cable" must not become an antenna).
const RULES: { slot: PartSlot; pattern: RegExp }[] = [
  { slot: 'pigtail', pattern: /pigtail/i },
  { slot: 'adapter', pattern: /adapter|mmcx/i },
  { slot: 'gps', pattern: /\bgps\b|gnss/i },
  { slot: 'servo', pattern: /servo/i },
  { slot: 'videoUnit', pattern: /digital video|avatar|fpv hd|hd kit/i },
  { slot: 'camera', pattern: /camera|cam\b/i },
  { slot: 'receiver', pattern: /receiver|elrs|expresslrs/i },
  { slot: 'vtx', pattern: /transmitter|\bvtx\b/i },
  { slot: 'antenna', pattern: /antenna/i },
  { slot: 'battery', pattern: /batter|lipo/i },
  { slot: 'fasteners', pattern: /fastener|screw|bolt|hardware/i },
  { slot: 'frame', pattern: /frame/i },
  { slot: 'flightController', pattern: /flight controller|\bfc\b/i },
  { slot: 'esc', pattern: /speed controller|\besc\b/i },
  { slot: 'motor', pattern: /motor/i },
  { slot: 'propeller', pattern: /propeller|\bprops?\b/i }
];

const CORE_SLOTS: PartSlot[] = ['frame', 'flightController', 'esc', 'motor', 'propeller', 'battery', 'receiver'];

/** Slots every drone of the type is expected to have; missing ones are drawn as empty outlines. */
export function expectedSlots(type: DroneType): PartSlot[] {
  return type === 'Digital'
    ? [...CORE_SLOTS, 'videoUnit', 'antenna']
    : [...CORE_SLOTS, 'camera', 'vtx', 'antenna'];
}

export function slotFor(name: string): PartSlot | null {
  return RULES.find((rule) => rule.pattern.test(name))?.slot ?? null;
}

export interface PartGroup {
  slot: PartSlot;
  components: DroneComponent[];
  /** True when an open issue names one of this group's components. */
  hasOpenIssue: boolean;
}

export interface PartMap {
  groups: PartGroup[];
  /** Slots the type expects but the drone's list does not contain. */
  missing: PartSlot[];
  /** Components whose name matches no slot. */
  unmatched: DroneComponent[];
}

export function mapParts(components: DroneComponent[], issues: DroneIssue[], type: DroneType): PartMap {
  const bySlot = new Map<PartSlot, DroneComponent[]>();
  const unmatched: DroneComponent[] = [];
  for (const component of components) {
    const slot = slotFor(component.name);
    if (!slot) {
      unmatched.push(component);
    } else {
      bySlot.set(slot, [...(bySlot.get(slot) ?? []), component]);
    }
  }

  const flagged = new Set(
    issues
      .filter((issue) => issue.status === 'Open' && issue.componentName)
      .map((issue) => issue.componentName!.trim().toLowerCase())
  );

  const groups = PART_SLOTS.filter((slot) => bySlot.has(slot)).map((slot) => {
    const items = bySlot.get(slot)!;
    return { slot, components: items, hasOpenIssue: items.some((item) => flagged.has(item.name.trim().toLowerCase())) };
  });
  const missing = expectedSlots(type).filter((slot) => !bySlot.has(slot));
  return { groups, missing, unmatched };
}
