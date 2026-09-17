import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { PROJECT_API_ROOT } from './project.tokens';
import type {
  ProjectStats,
  Category,
  ContentLink,
  ContentRecord,
  Entity,
  Page,
  Phase,
  Project,
  ProjectTemplate,
  Report,
  Review,
  TeamMember,
  TemplateContent,
  UserOption,
} from './project.model';

@Injectable({ providedIn: 'root' })
export class ProjectApiService {
  private readonly http = inject(HttpClient);
  private readonly root = inject(PROJECT_API_ROOT);
  private readonly templates = '/app/custom/template';
  // Legacy controllers subtract one from pageNumber; returned Page.number stays zero-based.
  projectPage(filter: object, page = 0) {
    return this.http.post<Page<Project>>(`${this.root}/project/filter`, filter, {
      params: { pageNumber: page + 1, orderType: 1 },
    });
  }
  categoryStats() {
    return this.http.get<ProjectStats[]>(`${this.root}/stats/category`);
  }
  projectStats(categoryId: number) {
    return this.http.get<ProjectStats[]>(`${this.root}/stats/project`, {
      params: { id: categoryId },
    });
  }
  phaseStats(projectId: number) {
    return this.http
      .get<ProjectStats[] | { phaseMap: unknown; phaseResolutionMap: unknown }>(
        `${this.root}/stats/phase`,
        { params: { projectId } },
      )
      .pipe(
        map((value) => {
          if (Array.isArray(value)) return value;
          const parse = (raw: unknown): Record<string, unknown> =>
            typeof raw === 'string' ? JSON.parse(raw) : ((raw || {}) as Record<string, unknown>);
          const totals = parse(value.phaseMap),
            progress = parse(value.phaseResolutionMap);
          return Object.entries(totals).map(([id, raw]) => {
            const counts = parse(raw),
              percentages = parse(progress[id]);
            return {
              id: Number(id),
              total: Number(counts['T'] || 0),
              overdue: Number(counts['D'] || 0),
              alert: Number(counts['A'] || 0),
              progress: {
                toDo: Number(percentages['P'] || 0),
                doing: Number(percentages['T'] || 0),
                waiting: Number(percentages['W'] || 0),
                done: Number(percentages['D'] || 0),
              },
            };
          });
        }),
      );
  }
  getProject(id: number) {
    return this.http.get<Project>(`${this.root}/project`, { params: { id } });
  }
  createProject(categoryId: number, templateId = 0, nature = 'KANBAN') {
    return this.http.post<Project>(`${this.root}/project`, null, {
      params: { categoryId, nature, templateId },
    });
  }
  saveProject(value: Project) {
    return this.http.put<Project>(`${this.root}/project`, value);
  }
  categories(workspace = 'PROJECT') {
    return this.http.get<Category[]>(`/app/category/workspace/${workspace}/8`);
  }
  phases(projectId: number) {
    return this.http.get<Phase[]>(`${this.root}/phase/list`, {
      params: { projectId, maxPriority: '8' },
    });
  }
  getPhase(id: number) {
    return this.http.get<Phase>(`${this.root}/phase`, { params: { id } });
  }
  createPhase(projectId: number) {
    return this.http.post<Phase>(`${this.root}/phase`, null, { params: { projectId } });
  }
  savePhase(value: Phase) {
    return this.http.put<void>(`${this.root}/phase`, value).pipe(map(() => value));
  }
  deletePhase(phaseId: number) {
    return this.http.delete(`${this.root}/phase`, { params: { phaseId }, responseType: 'text' });
  }
  reports(projectId: number, page = 0, maxPriority = '8') {
    return this.http.get<Page<Report>>(`${this.root}/backlog`, {
      params: { projectId, maxPriority, pageNumber: page + 1 },
    });
  }
  phaseActivityList(reportPhaseId: number) {
    return this.http.get<Report[]>(`${this.root}/list`, { params: { reportPhaseId } });
  }
  phaseReports(reportPhaseId: number, page = 0) {
    return this.http.get<Page<Report>>(`${this.root}/page`, {
      params: { reportPhaseId, pageNumber: page + 1 },
    });
  }
  filterReports(filter: object, page = 0) {
    return this.http.post<Page<Report>>(`${this.root}/filter`, filter, {
      params: { pageNumber: page + 1 },
    });
  }
  getReport(id: number) {
    return this.http.get<Report>(this.root, { params: { id } });
  }
  createReport(phase: Phase) {
    return this.http.post<Report>(`${this.root}/NATURE_WORKLOAD`, phase);
  }
  saveReport(value: Report) {
    return this.http.put<Report>(this.root, value);
  }
  deleteReport(report: Report) {
    return this.http.delete(`${this.root}`, {
      params: { reportId: report.id, reportPhaseId: report.reportPhaseId },
    });
  }
  reviews(reportId: number) {
    return this.http.get<Review[]>(`${this.root}/review/list`, { params: { reportId } });
  }
  createReview(reportId: number) {
    return this.http.post<Review>(`${this.root}/review`, null, { params: { reportId } });
  }
  saveReview(value: Review) {
    return this.http.put<Review>(`${this.root}/review`, value);
  }
  team(projectId: number) {
    return this.http.get<TeamMember[]>(`${this.root}/team/list`, { params: { projectId } });
  }
  member(id: number) {
    return this.http.get<TeamMember>(`${this.root}/team`, { params: { id } });
  }
  searchUsers(categoryId: number, searchUser: string, excluded: number[]) {
    return this.http.post<UserOption[]>('/app/user/excluded', excluded, {
      params: { categoryId, searchUser },
    });
  }
  addMember(folderId: number, userId: number) {
    return this.http.post<TeamMember>(`${this.root}/team`, null, { params: { folderId, userId } });
  }
  saveMember(value: TeamMember) {
    return this.http.put<TeamMember>(`${this.root}/team`, value);
  }
  removeMember(id: number) {
    return this.http.delete(`${this.root}/team`, { params: { id } });
  }
  contents(reportId: number) {
    return this.http.get<ContentLink[]>('/app/content/task/report', { params: { reportId } });
  }
  searchContents(search: string, page = 0) {
    return this.http.post<Page<ContentRecord>>(
      '/app/content/filter',
      {
        search,
        priorities: { checked: ['0', '1', '2'] },
        contentTypes: { checked: ['D'] },
        pageSize: 24,
      },
      { params: { pageNumber: page + 1, activity: 'A' } },
    );
  }
  attachContent(reportId: number, contentId: number) {
    return this.http
      .post<Entity>('/app/content/task', null, { params: { reportId } })
      .pipe(map((draft) => ({ ...draft, reportId, contentId })));
  }
  saveContent(value: Entity) {
    return this.http.put<Entity>('/app/content/task', value);
  }
  removeContent(id: number, reportId: number) {
    return this.http.delete<ContentLink[]>('/app/content/task', { params: { id, reportId } });
  }
  templatePage(filter: object, page = 0) {
    return this.http.post<Page<ProjectTemplate>>(`${this.templates}/filter`, filter, {
      params: { pageNumber: page + 1 },
    });
  }
  getTemplate(id: number) {
    return this.http.get<ProjectTemplate>(this.templates, { params: { id } });
  }
  createTemplate(categoryId: number) {
    return this.http.post<ProjectTemplate>(this.templates, null, {
      params: { categoryId, workspace: 'TEMPLATE' },
    });
  }
  saveTemplate(value: ProjectTemplate) {
    return this.http.put<ProjectTemplate>(this.templates, value);
  }
  templateContents(templateId: number) {
    return this.http.get<TemplateContent[]>(`${this.templates}/content/list`, {
      params: { templateId },
    });
  }
  createTemplateContent(templateId: number, parentId = 0) {
    return this.http.post<TemplateContent>(`${this.templates}/content`, null, {
      params: { templateId, parentId, templateContentType: parentId ? 'REPORT' : 'REPORT_PHASE' },
    });
  }
  saveTemplateContent(value: TemplateContent) {
    return this.http.put<TemplateContent>(`${this.templates}/content`, value);
  }
  removeTemplateContent(id: number) {
    return this.http.delete(`${this.templates}/content`, { params: { id } });
  }
  uploadLogo(templateId: number, file: File) {
    const data = new FormData();
    data.append('file', file);
    data.append('reportTemplateId', String(templateId));
    return this.http.post<ProjectTemplate>(`${this.templates}/image`, data);
  }
}
