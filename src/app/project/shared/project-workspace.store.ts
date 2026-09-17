import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, defer, of, switchMap, tap, map } from 'rxjs';
import { AppState } from '@iservport/iservport-angular-ui';
import { ProjectApiService } from '../../api/project/project-api.service';
import type {
  Project,
  Report,
  ProjectTemplate,
  ProjectStats,
} from '../../api/project/project.model';
@Injectable()
export class ProjectWorkspaceStore {
  readonly api = inject(ProjectApiService);
  readonly route = inject(ActivatedRoute);
  readonly appState = inject(AppState);
  readonly project = signal<Project | null>(null);
  readonly report = signal<Report | null>(null);
  readonly template = signal<ProjectTemplate | null>(null);
  readonly stats = signal<ProjectStats | undefined>(undefined);
  readonly statsError = signal(false);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly canEdit = computed(
    () =>
      this.appState.authoritySignal()?.manager === true ||
      this.appState.authoritySignal()?.write === true ||
      this.appState.authoritySignal()?.writer === true,
  );
  constructor() {
    effect((onCleanup) => {
      const project = this.project();
      this.stats.set(undefined);
      this.statsError.set(false);
      if (!project) return;
      const request = this.api.projectStats(project.categoryId).subscribe({
        next: (stats) => this.stats.set(stats.find((s) => s.id === project.id)),
        error: () => this.statsError.set(true),
      });
      onCleanup(() => request.unsubscribe());
    });
    this.route.paramMap
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set('');
          this.project.set(null);
          this.report.set(null);
          this.template.set(null);
        }),
        switchMap((params) =>
          defer(() => {
            const templateId = Number(params.get('templateId'));
            const reportId = Number(params.get('reportId'));
            const projectId = Number(params.get('projectId'));
            if (templateId)
              return this.api.getTemplate(templateId).pipe(
                tap((value) => this.template.set(value)),
                map(() => true),
              );
            if (reportId)
              return this.api.getReport(reportId).pipe(
                tap((value) => this.report.set(value)),
                switchMap((value) => this.api.getProject(value.projectId || value.reportFolderId)),
                tap((value) => this.project.set(value)),
                map(() => true),
              );
            return this.api.getProject(projectId).pipe(
              tap((value) => this.project.set(value)),
              map(() => true),
            );
          }).pipe(
            catchError(() => {
              this.error.set('PROJECT_LOAD_ERROR');
              return of(false);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.loading.set(false));
  }
  refreshProject() {
    const id = this.project()?.id;
    if (id)
      this.api.getProject(id).subscribe({
        next: (v) => this.project.set(v),
        error: () => this.error.set('PROJECT_LOAD_ERROR'),
      });
  }
}
