import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Project, ProjectTemplate } from './project.model';
import { PROJECT_API_ROOT } from './project.tokens';

@Injectable({
  providedIn: 'root'
})
export class ProjectApiService {
  private readonly http = inject(HttpClient);
  private readonly apiRoot = inject(PROJECT_API_ROOT);

  listProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiRoot}`);
  }

  listTemplates(): Observable<ProjectTemplate[]> {
    return this.http.get<ProjectTemplate[]>(`${this.apiRoot}/template`);
  }

  getProject(projectId: string): Observable<Project> {
    return this.http.get<Project>(`${this.apiRoot}/${projectId}`);
  }
}
