import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

vi.mock('@iservport/iservport-angular-ui', async () => {
  const { Component, Pipe } = await import('@angular/core');
  class DateBadgeStub { date?: unknown; dateMode?: string; resolution?: string; }
  Component({ selector: 'date-badge', template: '', inputs: ['date', 'dateMode', 'resolution'] })(DateBadgeStub);
  class I18nStub { transform(value: string) { return value; } }
  Pipe({ name: 'i18n' })(I18nStub);
  return { DateBadgeComponent: DateBadgeStub, I18nPipe: I18nStub };
});
import { ProjectTimelineComponent } from './project-timeline.component';
import type { Phase } from '../../api/project/project.model';

const phases = [
  { id: 11, literal: '1', phaseName: 'First', scheduledStartDate: '2026-10-01', scheduledEndDate: '2026-10-20' },
  { id: 22, literal: '2', phaseName: 'Second', scheduledStartDate: '2026-10-21', scheduledEndDate: '2026-10-30' },
] as Phase[];

describe('Project phase rows', () => {
  function setup(selectable: boolean) {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ProjectTimelineComponent);
    fixture.componentRef.setInput('phases', phases);
    fixture.componentRef.setInput('projectId', 203);
    fixture.componentRef.setInput('selectable', selectable);
    fixture.componentRef.setInput('selectedId', 22);
    fixture.detectChanges();
    return fixture;
  }

  it('selects from the entire native button row and exposes the selected state', () => {
    const fixture = setup(true);
    const selected = vi.fn();
    fixture.componentInstance.phaseSelect.subscribe(selected);
    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    expect(buttons).toHaveLength(2);
    expect(buttons[0].type).toBe('button');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[1].classList.contains('project-phase-row--selected')).toBe(true);
    buttons[0].querySelector('date-badge')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(selected).toHaveBeenCalledExactlyOnceWith(11);
    expect(fixture.nativeElement.querySelector('select')).toBeNull();
  });

  it('keeps summary phase links addressable with project and phase context', () => {
    const fixture = setup(false);
    const links: HTMLAnchorElement[] = Array.from(fixture.nativeElement.querySelectorAll('a'));
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/schedule/203?phaseId=11', '/schedule/203?phaseId=22',
    ]);
  });

  it('keeps timeline dimensions finite when phase dates are absent or invalid', () => {
    const fixture = setup(true);
    const invalid = { ...phases[0], scheduledStartDate: 'invalid', scheduledEndDate: undefined };
    fixture.componentRef.setInput('phases', [invalid]);
    fixture.detectChanges();
    expect(fixture.componentInstance.offset(invalid)).toBe(0);
    expect(fixture.componentInstance.width(invalid)).toBe(0);
  });
});
