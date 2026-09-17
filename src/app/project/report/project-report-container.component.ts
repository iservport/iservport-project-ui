import { Component, inject, signal, effect } from '@angular/core';
import { DatePipe } from '@angular/common';
import { I18nPipe } from '@iservport/iservport-angular-ui';
import { ProjectWorkspaceStore } from '../shared/project-workspace.store';
import { ProjectEditorComponent } from '../shared/project-editor.component';
import { reviewFields } from '../shared/project-fields';
import type { Entity, Review } from '../../api/project/project.model';
@Component({
  selector: 'project-report-container',
  imports: [I18nPipe, DatePipe, ProjectEditorComponent],
  template: `
    @if (store.report(); as report) {
      <main class="project-page">
        <section class="project-panel p-4">
          <h2 class="h5">{{ 'PROJECT_DESCRIPTION' | i18n }}</h2>
          <div class="project-prose" [innerHTML]="report.taskDesc"></div>
          <p class="small text-secondary mt-3 mb-1">
            {{ 'PROJECT_COMPLETE' | i18n }}: {{ report.complete }}%
          </p>
          <div
            class="progress board-card__progress"
            role="progressbar"
            [attr.aria-label]="'PROJECT_COMPLETE' | i18n"
            [attr.aria-valuenow]="report.complete"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div
              class="progress-bar"
              [class.bg-success]="report.complete === 100"
              [class.bg-primary]="report.complete !== 100"
              [style.width.%]="report.complete"
            ></div>
          </div>
        </section>
        <section class="project-panel p-4 mt-3">
          <div class="d-flex justify-content-between align-items-center">
            <h2 class="h5">{{ 'PROJECT_MONITORING' | i18n }}</h2>
            @if (store.canEdit()) {
              <button class="btn btn-primary" [disabled]="saving()" (click)="create()">
                {{ 'PROJECT_NEW_REVIEW' | i18n }}
              </button>
            }
          </div>
          @if (error()) {
            <div class="alert alert-danger mt-3">{{ error() | i18n }}</div>
          }
          @for (review of reviews(); track review.id) {
            <article class="border-bottom py-3">
              <div class="d-flex gap-3 justify-content-between">
                <h3 class="h6">{{ review.reviewSummary }}</h3>
                <span class="text-secondary small">{{
                  review.issueDate | date: 'dd/MM/yyyy'
                }}</span>
              </div>
              <div class="project-prose" [innerHTML]="review.reviewText"></div>
              <div class="d-flex justify-content-between mt-2">
                <span class="badge text-bg-light">{{ review.complete }}%</span>
                @if (store.canEdit()) {
                  <button class="btn btn-outline-secondary btn-sm" (click)="edit(review)">
                    {{ 'PROJECT_EDIT' | i18n }}
                  </button>
                }
              </div>
            </article>
          } @empty {
            <p class="text-secondary mt-3">{{ 'PROJECT_NO_REVIEWS' | i18n }}</p>
          }
        </section>
      </main>
    }
    @if (editor(); as value) {
      <project-editor
        [value]="value"
        [fields]="fields"
        [busy]="saving()"
        [error]="saveError()"
        (save)="save($event)"
        (cancel)="editor.set(null); load()"
      />
    }
  `,
})
export class ProjectReportContainerComponent {
  readonly store = inject(ProjectWorkspaceStore);
  readonly reviews = signal<Review[]>([]);
  readonly editor = signal<Entity | null>(null);
  readonly error = signal('');
  readonly saveError = signal('');
  readonly saving = signal(false);
  readonly fields = reviewFields;
  constructor() {
    effect((onCleanup) => {
      const r = this.store.report();
      if (!r) return;
      const sub = this.store.api.reviews(r.id).subscribe({
        next: (v) => this.reviews.set(v),
        error: () => this.error.set('PROJECT_LOAD_ERROR'),
      });
      onCleanup(() => sub.unsubscribe());
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
