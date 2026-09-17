import { ProjectProgressComponent } from './project-progress.component';
import type { Observable } from 'rxjs';
import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  CustomStatsComponent,
  CustomContainerShellComponent,
  I18nPipe,
  type CustomBreadcrumbItem,
  type CustomNavItem,
} from '@iservport/iservport-angular-ui';
import { ProjectWorkspaceStore } from './project-workspace.store';
import { ProjectEditorComponent } from './project-editor.component';
import { projectFields, reportFields, templateFields, statusLabel } from './project-fields';
import type { Entity, Project, Report, ProjectTemplate } from '../../api/project/project.model';
@Component({
  selector: 'project-shell',
  imports: [
    ProjectProgressComponent,
    CustomStatsComponent,
    CustomContainerShellComponent,
    I18nPipe,
    DatePipe,
    ProjectEditorComponent,
  ],
  providers: [ProjectWorkspaceStore],
  template: `
    <custom-container-shell
      [breadcrumbs]="breadcrumbs()"
      [navigation]="navigation()"
      [breadcrumbCanEdit]="!!record() && store.canEdit()"
      breadcrumbEditLabel="PROJECT_EDIT"
      (breadcrumbEdit)="edit()"
      [ariaLabel]="'PROJECTS' | i18n"
    >
      <section customContainerHeader class="project-header">
        @if (store.loading()) {
          <p role="status">{{ 'PROJECT_LOADING' | i18n }}</p>
        }
        @if (store.error()) {
          <div class="alert alert-danger" role="alert">{{ store.error() | i18n }}</div>
        }
        @if (store.project(); as project) {
          <h1>{{ project.folderName }}</h1>
          @if (store.stats(); as stats) {
            <div class="my-3">
              <project-progress [progress]="stats.progress" />
              <div class="mt-2"><custom-stats [stats]="stats" /></div>
            </div>
          }
          @if (store.statsError()) {
            <p class="text-secondary" role="status">{{ 'PROJECT_STATS_ERROR' | i18n }}</p>
          }
          <div class="d-flex gap-3 flex-wrap text-secondary small">
            <span>{{ project.patternPrefix || project.folderCode }}</span
            ><span>{{ statusLabel(project.resolution) | i18n }}</span
            ><span>{{ 'PROJECT_START' | i18n }}: {{ project.startDate | date: 'dd/MM/yyyy' }}</span
            ><span>{{ 'PROJECT_END' | i18n }}: {{ project.endDate | date: 'dd/MM/yyyy' }}</span>
          </div>
        }
        @if (store.report(); as report) {
          <h2 class="h5 mt-3">{{ report.reportCode }} · {{ report.summary }}</h2>
        }
        @if (store.template(); as template) {
          <h1>{{ template.templateName }}</h1>
          <span class="text-secondary">{{ template.templateCode }}</span>
        }
      </section>
    </custom-container-shell>
    @if (editor(); as value) {
      <project-editor
        [value]="value"
        [fields]="fields()"
        [busy]="saving()"
        [error]="error()"
        (save)="save($event)"
        (cancel)="editor.set(null)"
      />
    }
  `,
})
export class ProjectShellComponent {
  readonly store = inject(ProjectWorkspaceStore);
  readonly statusLabel = statusLabel;
  readonly editor = signal<Entity | null>(null);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly record = computed(
    () => this.store.template() || this.store.report() || this.store.project(),
  );
  readonly fields = computed(() =>
    this.store.template() ? templateFields : this.store.report() ? reportFields : projectFields,
  );
  readonly breadcrumbs = computed<CustomBreadcrumbItem[]>(() => {
    const p = this.store.project(),
      r = this.store.report(),
      t = this.store.template();
    if (t)
      return [
        { key: 'home', label: 'PROJECT_BACK_TEMPLATES', route: '/template' },
        { key: 'template', label: t.templateName, active: true, translate: false },
      ];
    return [
      { key: 'home', label: 'PROJECT_BACK', route: '/' },
      ...(p
        ? [
            {
              key: 'project',
              label: p.patternPrefix || p.folderCode,
              route: ['/project', p.id],
              translate: false,
            },
          ]
        : []),
      ...(r ? [{ key: 'report', label: r.reportCode, active: true, translate: false }] : []),
    ];
  });
  readonly navigation = computed<CustomNavItem[]>(() => {
    const p = this.store.project(),
      r = this.store.report();
    if (!p) return [];
    return [
      { key: 'summary', label: 'PROJECT_SUMMARY', route: ['/project', p.id] },
      { key: 'schedule', label: 'PROJECT_ACTIVITIES', route: ['/schedule', p.id] },
      ...(r
        ? [
            { key: 'monitor', label: 'PROJECT_MONITORING', route: ['/id', r.id] },
            { key: 'content', label: 'PROJECT_CONTENT', route: ['/content', r.id] },
          ]
        : []),
      { key: 'conclusion', label: 'PROJECT_CONCLUSION', route: ['/conclusion', p.id] },
      { key: 'team', label: 'PROJECT_TEAM', route: ['/team', p.id] },
    ];
  });
  edit() {
    this.error.set('');
    this.editor.set(this.record());
  }
  save(value: Entity) {
    this.saving.set(true);
    this.error.set('');
    const request: Observable<Entity> = this.store.template()
      ? this.store.api.saveTemplate(value as ProjectTemplate)
      : this.store.report()
        ? this.store.api.saveReport(value as Report)
        : this.store.api.saveProject(value as Project);
    request.subscribe({
      next: (v) => {
        if (this.store.template()) this.store.template.set(v as ProjectTemplate);
        else if (this.store.report()) this.store.report.set(v as Report);
        else this.store.project.set(v as Project);
        this.editor.set(null);
        this.saving.set(false);
      },
      error: () => {
        this.error.set('PROJECT_SAVE_ERROR');
        this.saving.set(false);
      },
    });
  }
}
