import { expectedSlots, mapParts, slotFor } from './drone-parts';
import { DroneComponent, DroneIssue } from './models';

function component(name: string, detail: string | null = null, quantity = 1): DroneComponent {
  return { id: name, name, detail, quantity };
}

function issue(componentName: string | null, status: DroneIssue['status'] = 'Open'): DroneIssue {
  return {
    id: 'i1',
    title: 'Problem',
    description: null,
    componentName,
    status,
    reportedAtUtc: '2026-11-01T00:00:00Z',
    resolvedAtUtc: null
  };
}

describe('drone parts mapping', () => {
  it('maps every default component name to a slot', () => {
    const expected: Record<string, string> = {
      Frame: 'frame',
      'Flight controller': 'flightController',
      'Electronic speed controller': 'esc',
      Motor: 'motor',
      Propeller: 'propeller',
      'Digital video unit': 'videoUnit',
      'Analog camera': 'camera',
      'Analog video transmitter': 'vtx',
      Receiver: 'receiver',
      Antenna: 'antenna',
      'MMCX to SMA adapter cable': 'adapter',
      'VTX pigtail cable': 'pigtail',
      Battery: 'battery',
      Fasteners: 'fasteners'
    };
    for (const [name, slot] of Object.entries(expected)) {
      expect(slotFor(name)).withContext(name).toBe(slot as never);
    }
  });

  it('does not treat the adapter cable as an antenna', () => {
    expect(slotFor('MMCX to SMA adapter cable')).toBe('adapter');
  });

  it('returns null for unknown names', () => {
    expect(slotFor('Landing gear')).toBeNull();
  });

  it('lists unmatched components and missing expected slots', () => {
    const map = mapParts([component('Frame'), component('Landing gear')], [], 'Digital');
    expect(map.unmatched.map((item) => item.name)).toEqual(['Landing gear']);
    expect(map.missing).toContain('videoUnit');
    expect(map.missing).not.toContain('frame');
  });

  it('expects different video parts for each type', () => {
    expect(expectedSlots('Digital')).toContain('videoUnit');
    expect(expectedSlots('Digital')).not.toContain('vtx');
    expect(expectedSlots('Analog')).toContain('vtx');
    expect(expectedSlots('Analog')).not.toContain('videoUnit');
  });

  it('flags a slot only for open issues that name its component', () => {
    const parts = [component('Motor'), component('Frame')];
    const open = mapParts(parts, [issue('motor')], 'Analog');
    expect(open.groups.find((group) => group.slot === 'motor')?.hasOpenIssue).toBeTrue();
    expect(open.groups.find((group) => group.slot === 'frame')?.hasOpenIssue).toBeFalse();

    const resolved = mapParts(parts, [issue('Motor', 'Resolved')], 'Analog');
    expect(resolved.groups.find((group) => group.slot === 'motor')?.hasOpenIssue).toBeFalse();
  });
});
