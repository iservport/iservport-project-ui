import { Component, input, output, computed } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DateBadgeComponent, I18nPipe } from '@iservport/iservport-angular-ui';
import type { Phase, ProjectStats } from '../../api/project/project.model';
import { ProjectProgressComponent } from './project-progress.component';

@Component({
  selector: 'project-timeline',
  imports: [NgTemplateOutlet, I18nPipe, DateBadgeComponent, RouterLink, ProjectProgressComponent],
  template: `
    <section class="project-phases" [attr.aria-label]="'PROJECT_SCHEDULE' | i18n">
      <div class="project-phase-columns small text-secondary" aria-hidden="true">
        <span>{{ 'PROJECT_PHASE' | i18n }}</span>
        <span>{{ 'PROJECT_START' | i18n }}</span>
        <span>{{ 'PROJECT_END' | i18n }}</span>
        <span>{{ 'PROJECT_SCHEDULE' | i18n }}</span>
      </div>
      <ul class="list-unstyled m-0">
        @for (phase of phases(); track phase.id) {
          <li>
            @if (selectable()) {
              <button type="button" class="project-phase-row"
                [class.project-phase-row--selected]="selectedId() === phase.id"
                [attr.aria-pressed]="selectedId() === phase.id"
                (click)="phaseSelect.emit(phase.id)">
                <ng-container [ngTemplateOutlet]="row" [ngTemplateOutletContext]="{ $implicit: phase }" />
              </button>
            } @else {
              <a class="project-phase-row" [routerLink]="['/schedule', projectId()]"
                [queryParams]="{ phaseId: phase.id }">
                <ng-container [ngTemplateOutlet]="row" [ngTemplateOutletContext]="{ $implicit: phase }" />
              </a>
            }
          </li>
        } @empty {
          <li class="text-secondary py-2">{{ 'PROJECT_NO_PHASES' | i18n }}</li>
        }
      </ul>
      <ng-template #row let-phase>
        <span class="project-phase-title">
          <span class="project-phase-chevron" aria-hidden="true">{{ selectedId() === phase.id ? '▾' : '▸' }}</span>
          <span>{{ phase.literal }} · {{ phase.phaseName }}</span>
        </span>
        <span class="date-badge-inline"><span class="visually-hidden">{{ 'PROJECT_START' | i18n }}</span>
          <date-badge [date]="phase.scheduledStartDate" dateMode="calendar" resolution="I" />
        </span>
        <span class="date-badge-inline"><span class="visually-hidden">{{ 'PROJECT_END' | i18n }}</span>
          <date-badge [date]="phase.scheduledEndDate" dateMode="calendar" [resolution]="phase.resolution" />
        </span>
        <span class="project-phase-visuals">
          <span class="project-phase-range" [attr.aria-label]="'PROJECT_SCHEDULE' | i18n">
            <span class="bg-primary" [style.margin-left.%]="offset(phase)" [style.width.%]="width(phase)"></span>
          </span>
          @if (stats()[phase.id]; as phaseStats) { <project-progress [progress]="phaseStats.progress" /> }
        </span>
      </ng-template>
    </section>
  `,
})
export class ProjectTimelineComponent {
  readonly phases = input<Phase[]>([]);
  readonly projectId = input(0);
  readonly selectable = input(false);
  readonly selectedId = input(0);
  readonly stats = input<Record<number, ProjectStats>>({});
  readonly phaseSelect = output<number>();
  private readonly bounds = computed(() => {
    const values = this.phases()
      .flatMap((p) => [this.time(p.scheduledStartDate), this.time(p.scheduledEndDate)])
      .filter((v) => v > 0);
    return values.length ? { start: Math.min(...values), end: Math.max(...values) } : { start: 0, end: 0 };
  });
  private time(value: string | number | undefined) {
    const time = value ? new Date(value).getTime() : 0;
    return Number.isFinite(time) ? time : 0;
  }
  offset(p: Phase) {
    const b = this.bounds(), start = this.time(p.scheduledStartDate);
    return start && b.end > b.start ? Math.max(0, Math.min(98, ((start - b.start) / (b.end - b.start)) * 100)) : 0;
  }
  width(p: Phase) {
    const b = this.bounds(), start = this.time(p.scheduledStartDate), end = this.time(p.scheduledEndDate);
    if (!start || !end || end < start) return 0;
    return Math.max(2, Math.min(100 - this.offset(p), ((end - start) / Math.max(1, b.end - b.start)) * 100));
  }
}
