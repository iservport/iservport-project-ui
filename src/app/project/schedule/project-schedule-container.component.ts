import type { Observable } from 'rxjs';
import { Component, inject, signal, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import {
  CustomStatsComponent,
  CustomPaginationComponent,
  CustomSearchBarComponent,
  I18nPipe,
  I18nLookupService,
} from '@iservport/iservport-angular-ui';
import { ProjectWorkspaceStore } from '../shared/project-workspace.store';
import { ProjectProgressComponent } from '../shared/project-progress.component';
import { ProjectTimelineComponent } from '../shared/project-timeline.component';
import { ProjectEditorComponent } from '../shared/project-editor.component';
import { phaseFields, reportFields, statusLabel } from '../shared/project-fields';
import {
  emptyPage,
  type Entity,
  type Phase,
  type ProjectStats,
  type Report,
} from '../../api/project/project.model';
@Component({
  selector: 'project-schedule-container',
  imports: [
    ProjectProgressComponent,
    DatePipe,
    FormsModule,
    RouterLink,
    I18nPipe,
    CustomStatsComponent,
    CustomPaginationComponent,
    CustomSearchBarComponent,
    ProjectTimelineComponent,
    ProjectEditorComponent,
  ],
  templateUrl: './project-schedule-container.component.html',
})
export class ProjectScheduleContainerComponent {
  readonly store = inject(ProjectWorkspaceStore);
  private readonly i18n = inject(I18nLookupService);
  private readonly route = inject(ActivatedRoute);
  readonly phases = signal<Phase[]>([]);
  readonly stats = signal<Record<number, ProjectStats>>({});
  readonly statsError = signal(false);
  readonly selected = signal(0);
  readonly page = signal(emptyPage<Report>());
  readonly loading = signal(false);
  readonly error = signal('');
  readonly editor = signal<Entity | null>(null);
  readonly editorType = signal<'phase' | 'report'>('phase');
  readonly saving = signal(false);
  readonly saveError = signal('');
  readonly statusLabel = statusLabel;
  readonly phaseFields = phaseFields;
  readonly reportFields = reportFields;
  search = { search: '' };
  resolution = '';
  view = 'BOARD';
  private request?: { unsubscribe(): void };
  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = Number(params.get('phaseId'));
      if (id && this.phases().some((p) => p.id === id)) {
        this.selected.set(id);
        this.load();
      }
    });
    effect((onCleanup) => {
      const project = this.store.project();
      if (!project) return;
      const sub = this.store.api.phases(project.id).subscribe({
        next: (phases) => {
          this.phases.set(phases);
          const selected = Number(this.route.snapshot.queryParamMap.get('phaseId'));
          this.selected.set(phases.some((p) => p.id === selected) ? selected : phases[0]?.id || 0);
          this.load();
        },
        error: () => this.error.set('PROJECT_LOAD_ERROR'),
      });
      onCleanup(() => {
        sub.unsubscribe();
        this.request?.unsubscribe();
        this.statsRequest?.unsubscribe();
      });
    });
  }
  load(page = 0) {
    if (!this.phases().length) {
      this.page.set(emptyPage());
      return;
    }
    this.loadStats();
    this.request?.unsubscribe();
    this.loading.set(true);
    this.error.set('');
    this.request = this.store.api.phaseActivityList(this.selected()).subscribe({
      next: (all) => {
        const query = this.search.search.trim().toLocaleLowerCase();
        const rows = all.filter(
          (report) =>
            (!this.resolution || report.resolution === this.resolution) &&
            (!query ||
              (report.summary + ' ' + report.reportCode).toLocaleLowerCase().includes(query)),
        );
        const size = 24;
        const totalPages = Math.ceil(rows.length / size);
        const number = Math.max(0, Math.min(page, totalPages - 1));
        const content = rows.slice(number * size, (number + 1) * size);
        this.page.set({
          content,
          number,
          size,
          totalPages,
          totalElements: rows.length,
          numberOfElements: content.length,
          first: number === 0,
          last: number >= totalPages - 1,
        });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('PROJECT_LOAD_ERROR');
        this.loading.set(false);
      },
    });
  }

  private statsRequest?: { unsubscribe(): void };
  loadStats() {
    const project = this.store.project();
    if (!project) return;
    this.statsRequest?.unsubscribe();
    this.statsError.set(false);
    this.statsRequest = this.store.api.phaseStats(project.id).subscribe({
      next: (stats) => this.stats.set(Object.fromEntries(stats.map((s) => [s.id, s]))),
      error: () => {
        this.stats.set({});
        this.statsError.set(true);
      },
    });
  }
  select(id: number) {
    this.selected.set(Number(id));
    this.load();
  }
  currentPhase() {
    return this.phases().find((p) => p.id === this.selected());
  }
  createPhase() {
    const p = this.store.project();
    if (!p) return;
    this.saving.set(true);
    this.store.api.createPhase(p.id).subscribe({
      next: (v) => {
        this.editorType.set('phase');
        this.editor.set(v);
        this.saving.set(false);
      },
      error: () => this.fail(),
    });
  }
  editPhase() {
    const p = this.currentPhase();
    if (!p) return;
    this.store.api.getPhase(p.id).subscribe({
      next: (v) => {
        this.editorType.set('phase');
        this.editor.set(v);
      },
      error: () => this.fail(),
    });
  }
  createReport() {
    const p = this.currentPhase();
    if (!p) return;
    this.saving.set(true);
    this.store.api.getPhase(p.id).subscribe({
      next: (phase) =>
        this.store.api.createReport(phase).subscribe({
          next: (v) => {
            this.editorType.set('report');
            this.editor.set(v);
            this.saving.set(false);
          },
          error: () => this.fail(),
        }),
      error: () => this.fail(),
    });
  }
  save(value: Entity) {
    this.saving.set(true);
    this.saveError.set('');
    const request: Observable<Entity> =
      this.editorType() === 'phase'
        ? this.store.api.savePhase(value as Phase)
        : this.store.api.saveReport(value as Report);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.editor.set(null);
        this.refresh();
      },
      error: () => {
        this.saveError.set('PROJECT_SAVE_ERROR');
        this.saving.set(false);
      },
    });
  }
  refresh() {
    const p = this.store.project();
    if (p)
      this.store.api.phases(p.id).subscribe({
        next: (v) => {
          this.phases.set(v);
          if (!this.selected()) this.selected.set(v[0]?.id || 0);
          this.load();
        },
        error: () => this.fail(),
      });
  }
  close() {
    this.editor.set(null);
    this.refresh();
  }
  removePhase() {
    const p = this.currentPhase();
    if (p && window.confirm(this.deleteMessage()))
      this.store.api.deletePhase(p.id).subscribe({
        next: () => {
          this.selected.set(0);
          this.refresh();
        },
        error: () => this.fail(),
      });
  }
  private fail() {
    this.saving.set(false);
    this.error.set('PROJECT_SAVE_ERROR');
  }
  private deleteMessage() {
    return this.i18n.t('PROJECT_DELETE_PHASE');
  }
}
