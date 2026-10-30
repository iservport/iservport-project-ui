import type { Observable } from 'rxjs';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import {
  CustomStatsComponent,
  CustomContainerShellComponent,
  DateBadgeComponent,
  I18nPipe,
  type CustomBreadcrumbItem,
  type CustomNavItem,
} from '@iservport/iservport-angular-ui';
import { ProjectWorkspaceStore } from './project-workspace.store';
import { ProjectEditorComponent } from './project-editor.component';
import { projectFields, reportFields, templateFields, statusLabel } from './project-fields';
import type { Entity, Phase, Project, Report, ProjectTemplate, TeamMember } from '../../api/project/project.model';
import { actionPlanReportFields } from '../improve/project-action-plan.config';
@Component({
  selector: 'project-shell',
  imports: [
    CustomStatsComponent,
    CustomContainerShellComponent,
    I18nPipe,
    DateBadgeComponent,
    ProjectEditorComponent,
  ],
  providers: [ProjectWorkspaceStore],
  templateUrl: './project-shell.component.html',
})
export class ProjectShellComponent {
  readonly store = inject(ProjectWorkspaceStore);
  readonly statusLabel = statusLabel;
  readonly editor = signal<Entity | null>(null);
  readonly saving = signal(false);
  readonly error = signal('');
  private readonly actionPhases = signal<Phase[]>([]);
  private readonly actionTeam = signal<TeamMember[]>([]);
  constructor() {
    effect((onCleanup) => {
      const project = this.store.project();
      if (project?.nature !== '5W2H' || !this.store.report()) return;
      const request = forkJoin({ phases: this.store.api.phases(project.id), team: this.store.api.team(project.id) }).subscribe({
        next: ({ phases, team }) => { this.actionPhases.set(phases); this.actionTeam.set(team); },
        error: () => this.error.set('PROJECT_LOAD_ERROR'),
      });
      onCleanup(() => request.unsubscribe());
    });
  }
  readonly record = computed(
    () => this.store.template() || this.store.report() || this.store.project(),
  );
  readonly fields = computed(() =>
    this.store.template() ? templateFields : this.store.report()
      ? this.store.project()?.nature === '5W2H'
        ? actionPlanReportFields(this.actionPhases(), this.actionTeam(), this.store.report()!)
        : reportFields
      : projectFields,
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
              route: [p.nature === '5W2H' ? '/schedule' : '/project', p.id],
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
    if (p.nature === '5W2H') return [
      { key: 'schedule', label: 'PROJECT_5W2H', route: ['/schedule', p.id] },
      ...(r ? [
        { key: 'monitor', label: 'PROJECT_MONITORING', route: ['/id', r.id] },
        { key: 'content', label: 'PROJECT_CONTENT', route: ['/content', r.id] },
      ] : []),
      { key: 'team', label: 'PROJECT_5W2H_WHO', route: ['/team', p.id] },
    ];
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
