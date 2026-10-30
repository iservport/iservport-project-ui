import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';

// Exercise store behavior without loading the shared UI bundle and its editor assets.
vi.mock('@iservport/iservport-angular-ui', () => ({ AppState: class AppState {} }));
import { AppState } from '@iservport/iservport-angular-ui';
import { ProjectApiService } from '../../api/project/project-api.service';
import { emptyPage, type ProjectStats } from '../../api/project/project.model';
import { ProjectHomeStore } from './project-home.store';

describe('P1 category attention badges', () => {
  let categoryStats: Subject<ProjectStats[]>;
  let api: {
    categoryStats: ReturnType<typeof vi.fn>;
    categories: ReturnType<typeof vi.fn>;
    projectPage: ReturnType<typeof vi.fn>;
    projectStats: ReturnType<typeof vi.fn>;
    templatePage: ReturnType<typeof vi.fn>;
    homeFilterPreference: ReturnType<typeof vi.fn>;
    saveHomeFilterPreference: ReturnType<typeof vi.fn>;
  };

  function createStore(templates = false) {
    TestBed.configureTestingModule({
      providers: [
        ProjectHomeStore,
        { provide: ProjectApiService, useValue: api },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: { data: { templates } } } },
        { provide: AppState, useValue: { authoritySignal: () => ({}) } },
      ],
    });
    return TestBed.inject(ProjectHomeStore);
  }

  function stats(id: number, counts: Partial<ProjectStats> = {}): ProjectStats {
    return {
      id,
      total: 0,
      alert: 0,
      overdue: 0,
      progress: { toDo: 0, doing: 0, waiting: 0, done: 0 },
      ...counts,
    };
  }

  beforeEach(() => {
    categoryStats = new Subject<ProjectStats[]>();
    api = {
      categoryStats: vi.fn(() => categoryStats),
      categories: vi.fn(() => of([
        { id: 17, categoryName: 'Board A' },
        { id: 23, categoryName: 'Board B' },
        { id: 31, categoryName: 'Board C' },
      ])),
      projectPage: vi.fn(() => of(emptyPage())),
      projectStats: vi.fn(() => of([])),
      templatePage: vi.fn(() => of(emptyPage())),
      homeFilterPreference: vi.fn(() => of(null)),
      saveHomeFilterPreference: vi.fn(() => of({})),
    };
  });

  it('matches legacy alert/overdue precedence by category id, independent of totals and row order', () => {
    const store = createStore();
    categoryStats.next([
      stats(23, { total: 52, alert: 7, overdue: 2 }),
      stats(17, { total: 4, alert: 1, overdue: 3 }),
      stats(31, { total: 12 }),
    ]);

    const section = store.filter().sections.find((s) => s.key === 'categories');
    expect(section?.badgeMap).toEqual({ '17': 3, '23': 7, '31': 0 });
    // The shared filter suppresses falsy badges: a nonzero total alone must not display one.
    expect(section?.badgeMap?.['31']).toBeFalsy();
    expect(section?.labels).toEqual({ '17': 'Board A', '23': 'Board B', '31': 'Board C' });
  });

  it('keeps entity-wide attention counts when board filters or pagination change', () => {
    const store = createStore();
    store.updateFilter({
      ...store.filter(),
      search: 'changed search',
      sections: store.filter().sections.map((s) => ({
        ...s,
        checked: s.key === 'categories' ? [23] : s.key === 'resolutions' ? ['DONE'] : s.checked,
      })),
    });
    categoryStats.next([stats(17, { alert: 2 }), stats(23, { overdue: 1 })]);
    store.load(2);

    const section = store.filter().sections.find((s) => s.key === 'categories');
    expect(section?.badgeMap).toEqual({ '17': 2, '23': 1 });
    expect(section?.checked).toEqual([23]);
    expect(store.filter().search).toBe('changed search');
    expect(api.categoryStats).toHaveBeenCalledExactlyOnceWith();
    expect(api.projectPage).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'changed search', resolutions: { checked: ['DONE'] } }),
      2,
    );
  });

  it('does not apply project attention totals to the template home', () => {
    const store = createStore(true);
    expect(api.categoryStats).not.toHaveBeenCalled();
    expect(api.categories).toHaveBeenCalledWith('TEMPLATE');
    expect(store.filter().sections.find((s) => s.key === 'categories')?.badgeMap).toBeUndefined();
    expect(api.homeFilterPreference).not.toHaveBeenCalled();
  });

  it('waits for the saved dismissal before offering the chooser on P1', () => {
    const preference = new Subject<{ content: string }>();
    api.homeFilterPreference.mockReturnValue(preference);
    const store = createStore();
    expect(store.uiChoiceReady()).toBe(false);
    expect(api.projectPage).not.toHaveBeenCalled();
    preference.next({ content: JSON.stringify({ hideUiChoice: true }) });
    expect(store.uiChoiceReady()).toBe(true);
    expect(store.filter().hideUiChoice).toBe(true);
    expect(api.projectPage).toHaveBeenCalledWith(expect.objectContaining({ hideUiChoice: true }), 0);
    store.updateFilter({ ...store.filter(), search: 'alpha', hideUiChoice: false });
    expect(store.filter().hideUiChoice).toBe(true);
  });

  it.each([null, { content: '{}' }, { content: '{invalid' }])(
    'offers the chooser when dismissal is absent or malformed: %s', (preference) => {
      api.homeFilterPreference.mockReturnValue(of(preference));
      const store = createStore();
      expect(store.uiChoiceReady()).toBe(true);
      expect(store.filter().hideUiChoice).toBe(false);
    },
  );

  it('keeps P1 usable if loading the preference fails', () => {
    const preference = new Subject();
    api.homeFilterPreference.mockReturnValue(preference);
    const store = createStore();
    preference.error(new Error('Unavailable'));
    expect(store.uiChoiceReady()).toBe(true);
    expect(store.filter().hideUiChoice).toBe(false);
    expect(store.page()).toEqual(emptyPage());
  });

  it('persists dismissal with active filters and hides only after a successful save', () => {
    const save = new Subject();
    api.saveHomeFilterPreference.mockReturnValue(save);
    const store = createStore();
    store.updateFilter({ ...store.filter(), search: 'alpha' });
    const filter = store.filter();
    const pageLoads = api.projectPage.mock.calls.length;
    store.hideUiChoice().subscribe();
    expect(api.saveHomeFilterPreference).toHaveBeenCalledWith({ ...filter, hideUiChoice: true });
    expect(store.filter().hideUiChoice).toBe(false);
    save.next({});
    expect(store.filter().hideUiChoice).toBe(true);
    expect(api.projectPage).toHaveBeenCalledTimes(pageLoads);
  });
});
