import type { Observable } from 'rxjs';
import { inject, Injectable, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, switchMap, catchError, of, tap, forkJoin, map } from 'rxjs';
import { AppState, type FilterContainerModel } from '@iservport/iservport-angular-ui';
import { ProjectApiService } from '../../api/project/project-api.service';
import {
  emptyPage,
  type ProjectStats,
  type Entity,
  type Project,
  type ProjectTemplate,
  type Category,
  type Page,
} from '../../api/project/project.model';
import { backendFilter, projectFilter } from '../../project.config';
import { projectFields, templateFields } from '../shared/project-fields';
@Injectable()
export class ProjectHomeStore {
  readonly api = inject(ProjectApiService);
  private readonly router = inject(Router);
  readonly appState = inject(AppState);
  readonly canCreate = computed(() => {
    const a = this.appState.authoritySignal();
    return !!(a?.manager || a?.folder || a?.write || a?.writer);
  });
  readonly templates = !!inject(ActivatedRoute).snapshot.data['templates'];
  readonly filter = signal<FilterContainerModel>(projectFilter());
  readonly categories = signal<Category[]>([]);
  readonly page = signal<Page<Project | ProjectTemplate>>(emptyPage());
  readonly loading = signal(true);
  readonly error = signal('');
  readonly statsError = signal('');
  readonly stats = signal<Record<number, ProjectStats>>({});
  readonly editor = signal<Entity | null>(null);
  readonly saving = signal(false);
  readonly saveError = signal('');
  readonly fields = this.templates ? templateFields : projectFields;
  private readonly requests = new Subject<number>();
  constructor() {
    if (this.templates)
      this.filter.update((f) => ({
        ...f,
        preferenceType: undefined,
        workspace: 'TEMPLATE',
        sections: f.sections
          .filter((s) => s.key !== 'resolutions')
          .map((s) => (s.key === 'categories' ? { ...s, workspace: 'TEMPLATE' } : s)),
      }));
    this.requests
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set('');
        }),
        switchMap((page) => {
          const f = this.filter();
          const request: Observable<Page<Project | ProjectTemplate>> = this.templates
            ? this.api.templatePage(
                {
                  workspace: 'TEMPLATE',
                  search: f.search || '',
                  categoryId: this.categoryId(),
                  priorities: f.sections.find((s) => s.key === 'priorities')?.checked,
                },
                page,
              )
            : this.api.projectPage(backendFilter(f), page);
          this.statsError.set('');
          return forkJoin({
            page: request,
            stats:
              this.templates || !this.categoryId()
                ? of([])
                : this.api.projectStats(this.categoryId()).pipe(
                    catchError(() => {
                      this.statsError.set('PROJECT_STATS_ERROR');
                      return of([]);
                    }),
                  ),
          }).pipe(
            tap(({ stats }) => this.stats.set(Object.fromEntries(stats.map((s) => [s.id, s])))),
            map(({ page }) => page),
            catchError(() => {
              this.error.set('PROJECT_LOAD_ERROR');
              return of(emptyPage<Project | ProjectTemplate>());
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((page) => {
        this.page.set(page);
        this.loading.set(false);
      });
    if (!this.templates)
      this.api
        .categoryStats()
        .pipe(takeUntilDestroyed())
        .subscribe({
          next: (stats) =>
            this.filter.update((f) => ({
              ...f,
              sections: f.sections.map((s) =>
                s.key === 'categories'
                  ? { ...s, badgeMap: Object.fromEntries(stats.map((row) => [row.id, row.total])) }
                  : s,
              ),
            })),
          error: () => this.statsError.set('PROJECT_STATS_ERROR'),
        });
    this.api
      .categories(this.templates ? 'TEMPLATE' : 'PROJECT')
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (categories) => {
          this.categories.set(categories);
          this.filter.update((f) => ({
            ...f,
            sections: f.sections.map((s) =>
              s.key === 'categories'
                ? {
                    ...s,
                    labels: Object.fromEntries(categories.map((c) => [c.id, c.categoryName])),
                    checked: categories.length ? [categories[0].id] : [],
                  }
                : s,
            ),
          }));
          this.load();
        },
        error: () => {
          this.error.set('PROJECT_LOAD_ERROR');
          this.loading.set(false);
        },
      });
  }
  categoryId() {
    return Number(this.filter().sections.find((s) => s.key === 'categories')?.checked[0] || 0);
  }
  load(page = 0) {
    this.requests.next(page);
  }
  updateFilter(filter: FilterContainerModel) {
    this.filter.set(filter);
    this.load();
  }
  create() {
    if (!this.categoryId() || this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    const request: Observable<Entity> = this.templates
      ? this.api.createTemplate(this.categoryId())
      : this.api.createProject(this.categoryId());
    request.subscribe({
      next: (value) => {
        this.editor.set(value);
        this.saving.set(false);
      },
      error: () => {
        this.error.set('PROJECT_SAVE_ERROR');
        this.saving.set(false);
      },
    });
  }
  save(value: Entity) {
    this.saving.set(true);
    this.saveError.set('');
    const request: Observable<Entity> = this.templates
      ? this.api.saveTemplate(value as ProjectTemplate)
      : this.api.saveProject(value as Project);
    request.subscribe({
      next: (saved) => {
        this.editor.set(null);
        this.saving.set(false);
        void this.router.navigate(
          this.templates ? ['/template/id', saved.id] : ['/project', saved.id],
        );
      },
      error: () => {
        this.saveError.set('PROJECT_SAVE_ERROR');
        this.saving.set(false);
      },
    });
  }
  closeEditor() {
    this.editor.set(null);
    this.load();
  }
}
