import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProjectApiService } from './project-api.service';
import { emptyPage, type Phase, type Project } from './project.model';

describe('Project legacy API boundaries', () => {
  let api: ProjectApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ProjectApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('converts paginator indexes once, without changing backend Page.number', () => {
    let returned = -1;
    api
      .projectPage({ categories: { checked: [4] } }, 1)
      .subscribe((page) => (returned = page.number));
    const req = http.expectOne((r) => r.url === '/app/report/project/filter');
    expect(req.request.params.get('pageNumber')).toBe('2');
    expect(req.request.method).toBe('POST');
    req.flush({ ...emptyPage(), number: 1 });
    expect(returned).toBe(1);
  });

  it('loads project and activity ids with distinct backend contracts', () => {
    api.getProject(203).subscribe();
    api.getReport(4475).subscribe();
    http.expectOne('/app/report/project?id=203').flush({ id: 203 });
    http.expectOne('/app/report?id=4475').flush({ id: 4475, reportFolderId: 203 });
  });

  it('preserves optimistic locking and unedited metadata on updates', () => {
    const project: Project = {
      id: 203,
      version: 7,
      folderName: 'Changed',
      parsedContent: 'preserved',
      categoryId: 4,
      folderCode: 'PX',
      nature: 'KANBAN',
      resolution: 'TODO',
      priority: '1',
    };
    api.saveProject(project).subscribe();
    const req = http.expectOne('/app/report/project');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(project);
    req.flush(project);
  });

  it('uses the returned full phase and the legacy activity nature when creating', () => {
    const phase = {
      id: 141,
      projectId: 203,
      reportFolderId: 203,
      literal: '1',
      phaseName: 'Phase',
      version: 3,
    } as Phase;
    api.createReport(phase).subscribe();
    const req = http.expectOne('/app/report/NATURE_WORKLOAD');
    expect(req.request.body).toEqual(phase);
    req.flush({ id: 55 });
  });

  it('accepts an empty response from the phase update controller', () => {
    const phase = { id: 141, phaseName: 'Updated' } as Phase;
    let value: Phase | undefined;
    api.savePhase(phase).subscribe((result) => (value = result));
    http.expectOne('/app/report/phase').flush(null);
    expect(value).toEqual(phase);
  });

  it('creates templates in TEMPLATE workspace and sends draft content before a PUT', () => {
    api.createTemplate(12).subscribe();
    const create = http.expectOne((r) => r.url === '/app/custom/template');
    expect(create.request.params.get('workspace')).toBe('TEMPLATE');
    create.flush({ id: 9 });
    let draft: unknown;
    api.attachContent(4475, 88).subscribe((value) => (draft = value));
    const content = http.expectOne('/app/content/task?reportId=4475');
    expect(content.request.method).toBe('POST');
    content.flush({ id: 0, summary: '', reportId: 4475 });
    expect(draft).toEqual({ id: 0, summary: '', reportId: 4475, contentId: 88 });
  });
  it('loads category stats and scopes project stats with the controller id parameter', () => {
    api.categoryStats().subscribe();
    http.expectOne('/app/report/stats/category').flush([]);
    api.projectStats(12).subscribe();
    http.expectOne('/app/report/stats/project?id=12').flush([]);
  });
  it('decodes the legacy nested JSON phase stats without rescaling percentages', () => {
    let result: unknown;
    api.phaseStats(203).subscribe((value) => (result = value));
    http.expectOne('/app/report/stats/phase?projectId=203').flush({
      phaseMap: JSON.stringify({ 141: JSON.stringify({ T: 4, A: 1, D: 1 }) }),
      phaseResolutionMap: JSON.stringify({ 141: JSON.stringify({ P: 25, T: 25, D: 50 }) }),
    });
    expect(result).toEqual([
      {
        id: 141,
        total: 4,
        alert: 1,
        overdue: 1,
        progress: { toDo: 25, doing: 25, done: 50, waiting: 0 },
      },
    ]);
  });
});
