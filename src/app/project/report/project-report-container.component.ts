import { Component, computed, inject, signal, effect } from '@angular/core';
import { DatePipe } from '@angular/common';
import { I18nPipe, CustomIdentityAvatarComponent } from '@iservport/iservport-angular-ui';
import { ProjectActionCardComponent } from '../improve/project-action-card.component';
import { ProjectWorkspaceStore } from '../shared/project-workspace.store';
import { ProjectEditorComponent } from '../shared/project-editor.component';
import { reviewFields } from '../shared/project-fields';
import type { Entity, Review } from '../../api/project/project.model';
@Component({
  selector: 'project-report-container',
  imports: [CustomIdentityAvatarComponent, I18nPipe, DatePipe, ProjectEditorComponent, ProjectActionCardComponent],
  templateUrl: './project-report-container.component.html',
  styleUrl: './project-report-container.component.css',
})
export class ProjectReportContainerComponent {
  readonly store = inject(ProjectWorkspaceStore);
  readonly reviews = signal<Review[]>([]);
  readonly editor = signal<Entity | null>(null);
  readonly error = signal('');
  readonly saveError = signal('');
  readonly saving = signal(false);
  readonly fields = reviewFields;
  private readonly phaseName = signal('');
  readonly actionReport = computed(() => {
    const report = this.store.report();
    return report ? { ...report, phaseName: report.phaseName || this.phaseName() } : null;
  });
  constructor() {
    effect((onCleanup) => {
      const r = this.store.report();
      if (!r) return;
      this.phaseName.set('');
      const phaseRequest = this.store.project()?.nature === '5W2H' && r.reportPhaseId && !r.phaseName
        ? this.store.api.getPhase(r.reportPhaseId).subscribe({
            next: (phase) => this.phaseName.set(phase.phaseName),
            error: () => this.error.set('PROJECT_LOAD_ERROR'),
          })
        : undefined;
      const sub = this.store.api.reviews(r.id).subscribe({
        next: (v) => this.reviews.set(v),
        error: () => this.error.set('PROJECT_LOAD_ERROR'),
      });
      onCleanup(() => { sub.unsubscribe(); phaseRequest?.unsubscribe(); });
    });
  }
  load() {
    const r = this.store.report();
    if (r)
      this.store.api.reviews(r.id).subscribe({
        next: (v) => this.reviews.set(v),
        error: () => this.error.set('PROJECT_LOAD_ERROR'),
      });
  }
  edit(review: Review) {
    this.saveError.set('');
    this.editor.set(review);
  }
  create() {
    const r = this.store.report();
    if (!r) return;
    this.saving.set(true);
    this.store.api.createReview(r.id).subscribe({
      next: (v) => {
        this.editor.set(v);
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
    this.store.api.saveReview(value as Review).subscribe({
      next: () => {
        this.saving.set(false);
        this.editor.set(null);
        this.load();
        const r = this.store.report();
        if (r)
          this.store.api.getReport(r.id).subscribe({
            next: (v) => this.store.report.set(v),
            error: () => this.error.set('PROJECT_LOAD_ERROR'),
          });
      },
      error: () => {
        this.saveError.set('PROJECT_SAVE_ERROR');
        this.saving.set(false);
      },
    });
  }
}
