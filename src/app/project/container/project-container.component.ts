import { Component, inject, signal, effect, input } from '@angular/core';
import { I18nPipe } from '@iservport/iservport-angular-ui';
import { ProjectWorkspaceStore } from '../shared/project-workspace.store';
import { ProjectEditorComponent, type EditorField } from '../shared/project-editor.component';
import { ProjectTimelineComponent } from '../shared/project-timeline.component';
import type { Entity, Phase, Project } from '../../api/project/project.model';
@Component({
  selector: 'project-summary-container',
  imports: [I18nPipe, ProjectEditorComponent, ProjectTimelineComponent],
  template: `
    @if (store.project(); as project) {
      <main class="project-page">
        <section class="project-panel p-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h2 class="h5">
              {{ (conclusion() ? 'PROJECT_CONCLUSION' : 'PROJECT_DESCRIPTION') | i18n }}
            </h2>
            <div class="d-flex gap-2">
              @if (conclusion()) {
                <button class="btn btn-outline-secondary btn-sm" type="button" (click)="print()">
                  {{ 'PROJECT_PRINT' | i18n }}
                </button>
              }
              @if (store.canEdit()) {
                <button class="btn btn-primary btn-sm" type="button" (click)="editing.set(true)">
                  {{ 'PROJECT_EDIT' | i18n }}
                </button>
              }
            </div>
          </div>
          @if (conclusion() ? project.conclusion : project.contentAsString) {
            <div
              class="project-prose"
              [innerHTML]="conclusion() ? project.conclusion : project.contentAsString"
            ></div>
          } @else {
            <p class="text-secondary">{{ 'PROJECT_NO_DESCRIPTION' | i18n }}</p>
          }
          @if (!conclusion()) {
            @for (field of details; track field.key) {
              @if (project[field.key]) {
                <h3 class="h6 mt-4">{{ field.label | i18n }}</h3>
                <div class="project-prose" [innerHTML]="project[field.key]"></div>
              }
            }
          }
        </section>
        <section class="project-panel p-4 mt-3">
          <h2 class="h5">{{ 'PROJECT_SCHEDULE' | i18n }}</h2>
          @if (error()) {
            <p class="alert alert-danger">{{ error() | i18n }}</p>
          }
          <project-timeline [phases]="phases()" [projectId]="project.id" />
        </section>
      </main>
      @if (editing()) {
        <project-editor
          [value]="project"
          [fields]="fields()"
          [title]="conclusion() ? 'PROJECT_CONCLUSION' : 'PROJECT_DESCRIPTION'"
          [busy]="saving()"
          [error]="saveError()"
          (save)="save($event)"
          (cancel)="editing.set(false)"
        />
      }
    }
  `,
})
export class ProjectContainerComponent {
  readonly store = inject(ProjectWorkspaceStore);
  readonly conclusion = input(false);
  readonly phases = signal<Phase[]>([]);
  readonly error = signal('');
  readonly saveError = signal('');
  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly details = [
    { key: 'benefits', label: 'PROJECT_BENEFITS' },
    { key: 'assumptions', label: 'PROJECT_ASSUMPTIONS' },
    { key: 'deliverables', label: 'PROJECT_DELIVERABLES' },
    { key: 'constraints', label: 'PROJECT_CONSTRAINTS' },
  ];
  constructor() {
    effect((onCleanup) => {
      const p = this.store.project();
      if (!p) return;
      const sub = this.store.api.phases(p.id).subscribe({
        next: (v) => this.phases.set(v),
        error: () => this.error.set('PROJECT_LOAD_ERROR'),
      });
      onCleanup(() => sub.unsubscribe());
    });
  }
  fields(): EditorField[] {
    return this.conclusion()
      ? [{ key: 'conclusion', label: 'PROJECT_CONCLUSION', type: 'richtext' }]
      : [
          { key: 'contentAsString', label: 'PROJECT_DESCRIPTION', type: 'richtext' },
          ...this.details.map((f) => ({ ...f, type: 'richtext' as const })),
        ];
  }
  save(value: Entity) {
    this.saving.set(true);
    this.saveError.set('');
    this.store.api.saveProject(value as Project).subscribe({
      next: (v) => {
        this.store.project.set(v);
        this.editing.set(false);
        this.saving.set(false);
      },
      error: () => {
        this.saveError.set('PROJECT_SAVE_ERROR');
        this.saving.set(false);
      },
    });
  }
  print() {
    window.print();
  }
}
