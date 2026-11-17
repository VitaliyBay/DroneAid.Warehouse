import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DroneComponent, DroneDetail } from '../core/models';
import { DroneDiagramComponent } from './drone-diagram.component';

function component(name: string, detail: string | null, quantity = 1): DroneComponent {
  return { id: name, name, detail, quantity };
}

function drone(type: DroneDetail['type'], components: DroneComponent[], issueComponent: string | null = null): DroneDetail {
  return {
    id: 'd1',
    code: 'DABCN0001',
    nickname: 'Test',
    type,
    status: 'Available',
    statusChangedAtUtc: '2026-11-01T00:00:00Z',
    createdAtUtc: '2026-11-01T00:00:00Z',
    updatedAtUtc: '2026-11-01T00:00:00Z',
    components,
    issues: issueComponent
      ? [
          {
            id: 'i1',
            title: 'Problem',
            description: null,
            componentName: issueComponent,
            status: 'Open',
            reportedAtUtc: '2026-11-01T00:00:00Z',
            resolvedAtUtc: null
          }
        ]
      : [],
    videos: []
  };
}

describe('DroneDiagramComponent', () => {
  let fixture: ComponentFixture<DroneDiagramComponent>;

  function render(value: DroneDetail): HTMLElement {
    fixture = TestBed.createComponent(DroneDiagramComponent);
    fixture.componentRef.setInput('drone', value);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the digital video unit model and not the analog parts for a digital drone', () => {
    const element = render(
      drone('Digital', [
        component('Frame', 'Pilotix PT10 V3 frame'),
        component('Digital video unit', 'Walksnail Avatar GT Kit'),
        component('Receiver', 'Radiomaster BR4 ExpressLRS'),
        component('Antenna', 'Maple Wireless LHCP', 2)
      ])
    );

    const text = element.textContent ?? '';
    expect(text).toContain('Walksnail Avatar GT Kit');
    expect(text).toContain('Radiomaster BR4 ExpressLRS');
    expect(text).toContain('Maple Wireless LHCP');
    expect(text).not.toContain('Video transmitter');
    expect(element.querySelectorAll('svg .part').length).toBe(element.querySelectorAll('ol.parts li').length);
  });

  it('marks expected parts that are missing from the list', () => {
    const element = render(drone('Analog', [component('Frame', null)]));

    expect(element.querySelectorAll('svg .part.is-missing').length).toBeGreaterThan(3);
    expect(element.querySelector('svg .part:not(.is-missing)')).not.toBeNull();
    expect(element.textContent).toContain('Not in list');
  });

  it('flags a part named by an open issue', () => {
    const element = render(drone('Analog', [component('Frame', null), component('Motor', null, 4)], 'Motor'));

    expect(element.querySelectorAll('svg .part.has-issue').length).toBe(1);
    expect(element.textContent).toContain('Open issue');
  });

  it('lists components that match no part below the diagram', () => {
    const element = render(drone('Analog', [component('Frame', null), component('Landing gear', 'Foam skids'), component('Fasteners', null)]));

    const other = element.querySelector('ul.undrawn')?.textContent ?? '';
    expect(other).toContain('Landing gear');
    expect(other).toContain('Fasteners');
  });

  it('selects a part when its row is clicked', () => {
    const element = render(drone('Analog', [component('Frame', 'Pilotix PT10 V3 frame')]));

    (element.querySelector('ol.parts button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(element.querySelector('svg .part.is-on')).not.toBeNull();
    expect(element.querySelector('figcaption')?.textContent).toContain('Pilotix PT10 V3 frame');
  });
});
