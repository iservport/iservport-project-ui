import type { Observable } from 'rxjs';
import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { I18nPipe } from '@iservport/iservport-angular-ui';
import { ProjectWorkspaceStore } from '../shared/project-workspace.store';
import { ProjectEditorComponent } from '../shared/project-editor.component';
import { projectFields, templateContentFields } from '../shared/project-fields';
import type { Entity, TemplateContent, Category, Project } from '../../api/project/project.model';
@Component({
  selector: 'project-template-container',
  imports: [I18nPipe, FormsModule, ProjectEditorComponent],
  template: `
    @if (store.template(); as template) {
      <main class="project-page">
        <section class="project-panel p-4">
          <div class="d-flex gap-4 flex-wrap align-items-start">
            @if (template.externalLogoUrl) {
              <img
                [src]="template.externalLogoUrl"
                [alt]="template.templateName"
                class="project-template-logo"
              />
            }
            @if (store.canEdit()) {
              <div>
                <label class="form-label" for="logo">{{ 'PROJECT_CHOOSE_LOGO' | i18n }}</label
                ><input
                  class="form-control"
                  id="logo"
                  type="file"
                  accept="image/*"
                  [disabled]="busy()"
                  (change)="upload($event)"
                />
              </div>
            }
          </div>
          <div class="d-flex gap-3 flex-wrap align-items-end mt-4">
            @if (store.canEdit()) {
              <div>
                <label class="form-label" for="category">{{ 'PROJECT_BOARD' | i18n }}</label
                ><select class="form-select" id="category" [(ngModel)]="categoryId">
                  @for (category of categories(); track category.id) {
                    <option [ngValue]="category.id">{{ category.categoryName }}</option>
                  }
                </select>
              </div>
              <button
                class="btn btn-primary"
                [disabled]="!categoryId || busy()"
                (click)="createProject()"
              >
                {{ 'PROJECT_USE_TEMPLATE' | i18n }}</button
              ><button
                class="btn btn-outline-primary"
                [disabled]="busy()"
                (click)="createContent()"
              >
                {{ 'PROJECT_NEW_PHASE' | i18n }}
              </button>
            }
          </div>
          @if (error()) {
            <p class="alert alert-danger mt-3" role="alert">{{ error() | i18n }}</p>
          }
          <h2 class="h5 mt-4">{{ 'PROJECT_SCHEDULE' | i18n }}</h2>
          @for (phase of phases(); track phase.id) {
            <article class="border rounded p-3 mt-3">
              <div class="d-flex gap-3 justify-content-between align-items-center">
                <div>
                  <h3 class="h6">{{ phase.name }}</h3>
                  <span class="text-secondary small"
                    >{{ phase.duration }} {{ 'PROJECT_DAYS' | i18n }}</span
                  >
                </div>
                @if (store.canEdit()) {
                  <div class="d-flex gap-2">
                    <button class="btn btn-outline-secondary btn-sm" (click)="edit(phase)">
                      {{ 'PROJECT_EDIT' | i18n }}</button
                    ><button
                      class="btn btn-outline-primary btn-sm"
                      (click)="createContent(phase.id)"
                    >
                      {{ 'PROJECT_NEW_ACTIVITY' | i18n }}</button
                    ><button class="btn btn-outline-danger btn-sm" (click)="remove(phase)">
                      {{ 'PROJECT_REMOVE' | i18n }}
                    </button>
                  </div>
                }
              </div>
              @for (report of children(phase.id); track report.id) {
                <div
                  class="d-flex align-items-center justify-content-between gap-2 border-top py-3 mt-2"
                >
                  <span
                    >{{ report.name }}
                    <span class="text-secondary"
                      >· {{ report.duration }} {{ 'PROJECT_DAYS' | i18n }}</span
                    ></span
                  >
                  @if (store.canEdit()) {
                    <div class="d-flex gap-2">
                      <button class="btn btn-outline-secondary btn-sm" (click)="edit(report)">
                        {{ 'PROJECT_EDIT' | i18n }}</button
                      ><button class="btn btn-outline-danger btn-sm" (click)="remove(report)">
                        {{ 'PROJECT_REMOVE' | i18n }}
                      </button>
                    </div>
                  }
                </div>
              }
            </article>
          } @empty {
            <p class="text-secondary">{{ 'PROJECT_NO_PHASES' | i18n }}</p>
          }
        </section>
      </main>
    }
    @if (editor(); as value) {
      <project-editor
        [value]="value"
        [fields]="editingProject() ? projectFields : contentFields"
        [busy]="busy()"
        [error]="saveError()"
        (save)="save($event)"
        (cancel)="editor.set(null); load()"
      />
    }
  `,
})
export class ProjectTemplateContainerComponent {
  readonly store = inject(ProjectWorkspaceStore);
  private readonly router = inject(Router);
  readonly contents = signal<TemplateContent[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly editor = signal<Entity | null>(null);
  readonly editingProject = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly saveError = signal('');
  readonly contentFields = templateContentFields;
  readonly projectFields = projectFields;
  categoryId = 0;
  constructor() {
    effect((onCleanup) => {
      const t = this.store.template();
      if (!t) return;
      const sub = this.store.api.templateContents(t.id).subscribe({
        next: (v) => this.contents.set(v),
        error: () => this.error.set('PROJECT_LOAD_ERROR'),
      });
      onCleanup(() => sub.unsubscribe());
    });
    this.store.api.categories().subscribe({
      next: (v) => {
        this.categories.set(v);
        this.categoryId = v[0]?.id || 0;
      },
      error: () => this.error.set('PROJECT_LOAD_ERROR'),
    });
  }
  phases() {
    return this.contents()
      .filter((v) => v.templateContentType === 'REPORT_PHASE')
      .sort((a, b) => a.sequence - b.sequence);
  }
  children(id: number) {
    return this.contents()
      .filter((v) => v.parentId === id && v.templateContentType !== 'REPORT_PHASE')
      .sort((a, b) => a.sequence - b.sequence);
  }
  load() {
    const t = this.store.template();
    if (t)
      this.store.api
        .templateContents(t.id)
        .subscribe({ next: (v) => this.contents.set(v), error: () => this.fail() });
  }
  edit(value: TemplateContent) {
    this.editingProject.set(false);
    this.saveError.set('');
    this.editor.set(value);
  }
  createContent(parentId = 0) {
    const t = this.store.template();
    if (!t) return;
    this.busy.set(true);
    this.store.api.createTemplateContent(t.id, parentId).subscribe({
      next: (v) => {
        this.edit(v);
        this.busy.set(false);
      },
      error: () => this.fail(),
    });
  }
  createProject() {
    const t = this.store.template();
    if (!t || !this.categoryId) return;
    this.busy.set(true);
    this.store.api.createProject(this.categoryId, t.id, 'KANBAN').subscribe({
      next: (v) => {
        this.editingProject.set(true);
        this.editor.set(v);
        this.busy.set(false);
      },
      error: () => this.fail(),
    });
  }
  save(value: Entity) {
    this.busy.set(true);
    this.saveError.set('');
    const request: Observable<Entity> = this.editingProject()
      ? this.store.api.saveProject(value as Project)
      : this.store.api.saveTemplateContent(value as TemplateContent);
    request.subscribe({
      next: (v) => {
        this.busy.set(false);
        this.editor.set(null);
        if (this.editingProject()) void this.router.navigate(['/project', v.id]);
        else this.load();
      },
      error: () => {
        this.saveError.set('PROJECT_SAVE_ERROR');
        this.busy.set(false);
      },
    });
  }
  remove(value: TemplateContent) {
    this.busy.set(true);
    this.store.api.removeTemplateContent(value.id).subscribe({
      next: () => {
        this.busy.set(false);
        this.load();
      },
      error: () => this.fail(),
    });
  }
  upload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    const t = this.store.template();
    if (!file || !t) return;
    this.busy.set(true);
    this.store.api.uploadLogo(t.id, file).subscribe({
      next: (v) => {
        this.store.template.set(v);
        this.busy.set(false);
      },
      error: () => this.fail(),
    });
  }
  private fail() {
    this.busy.set(false);
    this.error.set('PROJECT_SAVE_ERROR');
  }
}
