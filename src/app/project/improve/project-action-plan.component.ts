import { Component, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, of, Subject, switchMap, type Observable } from 'rxjs';
import {
  CustomFilterContainer, CustomIdentityAvatarComponent, CustomPaginationComponent,
  CustomSearchBarComponent, DateBadgeComponent, I18nPipe,
  type FilterContainerModel,
} from '@iservport/iservport-angular-ui';
import { emptyPage, type Entity, type Phase, type Report, type Review, type TeamMember } from '../../api/project/project.model';
import { ProjectWorkspaceStore } from '../shared/project-workspace.store';
import { ProjectEditorComponent } from '../shared/project-editor.component';
import { backendFilter } from '../../project.config';
import { actionPlanFilter, actionPlanPhaseFields, actionPlanReportFields } from './project-action-plan.config';
import { ProjectActionCardComponent } from './project-action-card.component';

@Component({
  selector: 'project-action-plan',
  imports: [CustomFilterContainer, CustomPaginationComponent, CustomSearchBarComponent,
    CustomIdentityAvatarComponent, DateBadgeComponent, I18nPipe, RouterLink,
    ProjectEditorComponent, ProjectActionCardComponent],
  templateUrl: './project-action-plan.component.html',
  styleUrl: './project-action-plan.component.css',
})
export class ProjectActionPlanComponent {
  readonly store = inject(ProjectWorkspaceStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly phases = signal<Phase[]>([]);
  readonly team = signal<TeamMember[]>([]);
  readonly filter = signal(actionPlanFilter([], []));
  readonly page = signal(emptyPage<Report>());
  readonly reviews = signal(emptyPage<Review>());
  readonly loading = signal(true);
  readonly reviewsLoading = signal(false);
  readonly error = signal('');
  readonly reviewsError = signal('');
  readonly editor = signal<Entity | null>(null);
  readonly editorType = signal<'phase' | 'report'>('report');
  readonly saving = signal(false);
  readonly saveError = signal('');
  private readonly requests = new Subject<number>();
  private readonly reviewRequests = new Subject<number>();
  readonly phaseFields = actionPlanPhaseFields;
  reportFields() {
    return actionPlanReportFields(this.phases(), this.team(), this.editor() as Report | undefined);
  }
  selectedPhase() {
    const selected = this.filter().sections.find((s) => s.key === 'phases')?.checked[0];
    return this.phases().find((p) => p.id === Number(selected));
  }
  constructor() {
    this.requests.pipe(
      switchMap((page) => {
        this.loading.set(true);
        this.error.set('');
        const filter = this.filter();
        if (!filter.sections.find((s) => s.key === 'phases')?.checked.length) return of(emptyPage<Report>());
        return this.store.api.filterReports(backendFilter(filter), page).pipe(
          catchError(() => {
            this.error.set('PROJECT_LOAD_ERROR');
            return of(emptyPage<Report>());
          }),
        );
      }), takeUntilDestroyed(),
    ).subscribe((page) => { this.page.set(page); this.loading.set(false); });
    this.reviewRequests.pipe(
      switchMap((page) => {
        this.reviewsLoading.set(true);
        this.reviewsError.set('');
        return this.store.api.projectReviews(this.store.project()!.id, page).pipe(
          catchError(() => {
            this.reviewsError.set('PROJECT_LOAD_ERROR');
            return of(emptyPage<Review>());
          }),
        );
      }), takeUntilDestroyed(),
    ).subscribe((page) => { this.reviews.set(page); this.reviewsLoading.set(false); });
    effect((onCleanup) => {
      const project = this.store.project();
      if (!project) return;
      untracked(() => {
        this.loading.set(true);
        this.phases.set([]);
        this.team.set([]);
        this.filter.set(actionPlanFilter([], []));
        this.page.set(emptyPage());
        this.load();
        this.loading.set(true);
        const request = forkJoin({
          phases: this.store.api.phases(project.id), team: this.store.api.team(project.id),
        }).subscribe({
          next: ({ phases, team }) => {
            this.phases.set(phases);
            this.team.set(team);
            this.filter.set(actionPlanFilter(phases, team, Number(this.route.snapshot.queryParamMap.get('phaseId'))));
            this.load();
          },
          error: () => { this.error.set('PROJECT_LOAD_ERROR'); this.loading.set(false); },
        });
        this.loadReviews();
        onCleanup(() => request.unsubscribe());
      });
    });
  }
  load(page = 0) { this.requests.next(page); }
  loadReviews(page = 0) { this.reviewRequests.next(page); }
  updateFilter(filter: FilterContainerModel) {
    this.filter.set(filter);
    const selected = filter.sections.find((s) => s.key === 'phases')?.checked;
    void this.router.navigate([], {
      relativeTo: this.route, queryParams: { phaseId: selected?.length === 1 ? selected[0] : null },
      queryParamsHandling: 'merge', replaceUrl: true,
    });
    this.load();
  }
  search(value: { search?: string }) {
    this.filter.update((f) => ({ ...f, search: value.search || '' }));
    this.load();
  }
  createPhase() {
    const project = this.store.project();
    if (!project || this.saving() || !this.store.canEdit()) return;
    this.open(this.store.api.createPhase(project.id), 'phase');
  }
  editPhase() {
    const phase = this.selectedPhase();
    if (phase && !this.saving() && this.store.canEdit()) this.open(this.store.api.getPhase(phase.id), 'phase');
  }
  createReport() {
    const phase = this.selectedPhase();
    if (!phase || this.saving() || !this.store.canEdit()) return;
    this.open(this.store.api.getPhase(phase.id).pipe(switchMap((p) => this.store.api.createReport(p))), 'report');
  }
  editReport(id: number) {
    if (!this.saving() && this.store.canEdit()) this.open(this.store.api.getReport(id), 'report');
  }
  private open(request: Observable<Entity>, type: 'phase' | 'report') {
    this.saving.set(true);
    this.saveError.set('');
    request.subscribe({
      next: (value) => { this.editorType.set(type); this.editor.set(value); this.saving.set(false); },
      error: () => { this.error.set('PROJECT_LOAD_ERROR'); this.saving.set(false); },
    });
  }
  save(value: Entity) {
    this.saving.set(true);
    this.saveError.set('');
    const request: Observable<Entity> = this.editorType() === 'phase'
      ? this.store.api.savePhase(value as Phase) : this.store.api.saveReport(value as Report);
    request.subscribe({
      next: () => { this.saving.set(false); this.editor.set(null); this.refresh(value); },
      error: () => { this.saveError.set('PROJECT_SAVE_ERROR'); this.saving.set(false); },
    });
  }
  close() { this.editor.set(null); this.refresh(); }
  private refresh(saved?: Entity) {
    const project = this.store.project();
    if (!project) return;
    this.store.api.phases(project.id).subscribe({
      next: (phases) => {
        this.phases.set(phases);
        const targetId = saved ? Number(this.editorType() === 'phase' ? saved.id : saved['reportPhaseId']) : 0;
        this.filter.update((f) => ({ ...f, sections: f.sections.map((s) => s.key === 'phases' ? {
          ...s, labels: Object.fromEntries(phases.map((p) => [p.id, p.phaseName])),
          checked: targetId ? [targetId] : s.checked.filter((id) => phases.some((p) => p.id === Number(id))),
        } : s) }));
        this.updateFilter(this.filter());
      },
      error: () => this.error.set('PROJECT_LOAD_ERROR'),
    });
  }
}
