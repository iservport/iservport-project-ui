import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';

vi.mock('@iservport/iservport-angular-ui', async () => {
  const { Component, Pipe } = await import('@angular/core');
  function stub(selector: string, inputs: string[]) {
    class Stub {}
    Component({ selector, template: '', inputs })(Stub);
    return Stub;
  }
  class I18nStub { transform(value: string) { return value; } }
  Pipe({ name: 'i18n' })(I18nStub);
  return {
    I18nPipe: I18nStub,
    CustomFilterContainer: stub('custom-filter-container', ['filter', 'disabled']),
    CustomPaginationComponent: stub('custom-pagination', ['page', 'alwaysShow']),
    CustomSearchBarComponent: stub('custom-search-bar', ['filter', 'placeholder']),
    CustomIdentityAvatarComponent: stub('custom-identity-avatar', ['identityId', 'size']),
    DateBadgeComponent: stub('date-badge', ['date', 'dateMode', 'resolution']),
    CustomFroalaComponent: stub('custom-froala', ['id', 'assetBaseUrl', 'target', 'disabled']),
  };
});
import { ProjectReportContainerComponent } from '../report/project-report-container.component';
import { ProjectActionPlanComponent } from './project-action-plan.component';
import { ProjectWorkspaceStore } from '../shared/project-workspace.store';
import { emptyPage, type Phase, type Project, type Report, type Review, type TeamMember } from '../../api/project/project.model';

const phases = [
  { id: 11, projectId: 203, literal: 'A', phaseName: 'Production', version: 4 },
  { id: 22, projectId: 203, literal: 'B', phaseName: 'Logistics', version: 7 },
] as Phase[];
const team = [{ id: 8, userId: 50, identityId: 500, displayName: 'Alex' }] as TeamMember[];
const report = {
  id: 44, version: 3, reportFolderId: 203, reportPhaseId: 22, reportCode: 'ACT-44',
  summary: 'Reduce waste', taskDesc: '<p>Improve sorting</p>', taskCause: '<b>Material loss</b>',
  taskDetail: '<p>Training / R$ 500</p>', phaseName: 'Logistics', reporterId: 500,
  resolution: 'P', complete: 0, priority: '1', parsedContent: 'preserve me',
} as Report;
const pageOf = <T>(content: T[]) => ({ ...emptyPage<T>(), content, totalElements: content.length, numberOfElements: content.length });

function setup() {
  const requests: Subject<ReturnType<typeof pageOf<Report>>>[] = [];
  const api = {
    phases: vi.fn(() => of(phases)), team: vi.fn(() => of(team)),
    filterReports: vi.fn((_filter: object, _page = 0) => { const request = new Subject<ReturnType<typeof pageOf<Report>>>(); requests.push(request); return request; }),
    projectReviews: vi.fn(() => of(pageOf<Review>([]))),
    getPhase: vi.fn(() => of(phases[1])), createPhase: vi.fn(() => of({ ...phases[0], id: 33 })),
    createReport: vi.fn(() => of(report)), getReport: vi.fn(() => of(report)),
    saveReport: vi.fn((value: Report) => of(value)), savePhase: vi.fn((value: Phase) => of(value)),
  };
  const store = { api, project: signal({ id: 203, nature: '5W2H' } as Project), canEdit: signal(true) };
  TestBed.configureTestingModule({ providers: [
    provideRouter([]),
    { provide: ProjectWorkspaceStore, useValue: store },
    { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ phaseId: '22' }) } } },
  ] });
  vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(ProjectActionPlanComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, api, requests, store };
}

describe('5W2H workspace', () => {
  it('scopes actions by area, status, priority and identity while paging follow-ups independently', () => {
    const { component, api } = setup();
    expect(api.filterReports).toHaveBeenCalledWith(expect.objectContaining({
      phases: { checked: [22] }, resolutions: { checked: ['P', 'T', 'D'] },
      priorities: { checked: ['0', '1', '2'] }, team: { checked: [500] },
      ordering: { checked: ['internalNumber'] },
    }), 0);
    component.load(1);
    expect(api.filterReports.mock.calls.at(-1)?.[1]).toBe(1);
    const calls = api.filterReports.mock.calls.length;
    component.loadReviews(2);
    expect(api.projectReviews).toHaveBeenLastCalledWith(203, 2);
    expect(api.filterReports).toHaveBeenCalledTimes(calls);
  });

  it('cancels obsolete action results and does not request actions with no selected area', () => {
    const { component, requests, api } = setup();
    component.search({ search: 'new search' });
    requests[0].next(pageOf([report]));
    expect(component.page().content).toEqual([]);
    requests[1].next(pageOf([{ ...report, summary: 'Current result' }]));
    expect(component.page().content[0].summary).toBe('Current result');
    component.updateFilter({ ...component.filter(), sections: component.filter().sections.map((s) => s.key === 'phases' ? { ...s, checked: [] } : s) });
    expect(api.filterReports).toHaveBeenCalledTimes(2);
    expect(component.page().content).toEqual([]);
    expect(component.loading()).toBe(false);
  });

  it('renders the legacy field mapping and opens the activity URL', () => {
    const { fixture, requests } = setup();
    requests[0].next(pageOf([report]));
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('project-action-card');
    expect(card.textContent).toContain('Material loss');
    expect(card.textContent).toContain('Training / R$ 500');
    expect(card.textContent).toContain('Logistics');
    expect(card.querySelector('a').getAttribute('href')).toBe('/id/44');
    expect(card.querySelectorAll('dt')).toHaveLength(4);
    expect(card.querySelector('custom-identity-avatar')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.action-plan-layout > *')).toHaveLength(3);
  });

  it('creates from a full phase and preserves locking and unedited metadata on save', () => {
    const { component, api } = setup();
    component.createReport();
    expect(api.getPhase).toHaveBeenCalledWith(22);
    expect(api.createReport).toHaveBeenCalledExactlyOnceWith(phases[1]);
    const fields = component.reportFields();
    expect(fields.find((f) => f.key === 'reporterId')?.options).toContainEqual({ value: 500, label: 'Alex', literal: true });
    component.save({ ...component.editor()!, taskCause: '<p>Updated reason</p>' });
    expect(api.saveReport).toHaveBeenCalledExactlyOnceWith({ ...report, taskCause: '<p>Updated reason</p>' });
    expect(component.editor()).toBeNull();
  });

  it('retains an edited draft after a failed save and blocks write actions for readers', () => {
    const { component, api, store } = setup();
    component.editReport(44);
    api.saveReport.mockReturnValueOnce(throwError(() => new Error('save failed')));
    component.save(report);
    expect(component.editor()).toEqual(report);
    expect(component.saveError()).toBe('PROJECT_SAVE_ERROR');
    expect(component.saving()).toBe(false);
    store.canEdit.set(false);
    component.createPhase();
    component.createReport();
    component.editReport(44);
    expect(api.createPhase).not.toHaveBeenCalled();
    expect(api.createReport).not.toHaveBeenCalled();
    expect(api.getReport).toHaveBeenCalledTimes(1);
  });
});


describe('5W2H activity details', () => {
  function detail(nature: string) {
    const api = { reviews: vi.fn(() => of([])), getPhase: vi.fn(() => of(phases[1])) };
    const store = {
      api, report: signal({ ...report, phaseName: undefined }),
      project: signal({ id: 203, nature } as Project), canEdit: signal(false),
    };
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: ProjectWorkspaceStore, useValue: store }] });
    const fixture = TestBed.createComponent(ProjectReportContainerComponent);
    fixture.detectChanges();
    return { fixture, api };
  }
  it('shows all 5W2H fields beside follow-ups and resolves the area from a full report entity', () => {
    const { fixture, api } = detail('5W2H');
    expect(api.getPhase).toHaveBeenCalledExactlyOnceWith(22);
    expect(fixture.nativeElement.querySelector('.action-detail-layout')).not.toBeNull();
    const card = fixture.nativeElement.querySelector('project-action-card');
    expect(card.textContent).toContain('Logistics');
    expect(card.textContent).toContain('Material loss');
    expect(card.querySelector('.action-card-fields-vertical')).not.toBeNull();
  });
  it('preserves the ordinary activity description and progress layout', () => {
    const { fixture, api } = detail('KANBAN');
    expect(fixture.nativeElement.querySelector('project-action-card')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="progressbar"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Improve sorting');
    expect(api.getPhase).not.toHaveBeenCalled();
  });
});
