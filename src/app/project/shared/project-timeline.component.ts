import { Component, input, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { I18nPipe } from '@iservport/iservport-angular-ui';
import type { Phase } from '../../api/project/project.model';
@Component({
  selector: 'project-timeline',
  imports: [I18nPipe, DatePipe, RouterLink],
  template: ` <div class="table-responsive">
    <table class="table align-middle mb-0">
      <caption class="visually-hidden">
        {{
          'PROJECT_SCHEDULE' | i18n
        }}
      </caption>
      <thead>
        <tr>
          <th>{{ 'PROJECT_PHASE' | i18n }}</th>
          <th>{{ 'PROJECT_START' | i18n }}</th>
          <th>{{ 'PROJECT_END' | i18n }}</th>
          <th class="w-25">{{ 'PROJECT_SCHEDULE' | i18n }}</th>
        </tr>
      </thead>
      <tbody>
        @for (phase of phases(); track phase.id) {
          <tr>
            <td>
              <a [routerLink]="['/schedule', projectId()]" [queryParams]="{ phaseId: phase.id }"
                >{{ phase.literal }} · {{ phase.phaseName }}</a
              >
            </td>
            <td>{{ phase.scheduledStartDate | date: 'dd/MM/yyyy' }}</td>
            <td>{{ phase.scheduledEndDate | date: 'dd/MM/yyyy' }}</td>
            <td>
              <div class="bg-body-tertiary rounded" style="height:12px">
                <div
                  class="bg-primary rounded"
                  style="height:12px"
                  [style.margin-left.%]="offset(phase)"
                  [style.width.%]="width(phase)"
                ></div>
              </div>
            </td>
          </tr>
        } @empty {
          <tr>
            <td colspan="4" class="text-secondary">{{ 'PROJECT_NO_PHASES' | i18n }}</td>
          </tr>
        }
      </tbody>
    </table>
  </div>`,
})
export class ProjectTimelineComponent {
  readonly phases = input<Phase[]>([]);
  readonly projectId = input(0);
  private readonly bounds = computed(() => {
    const values = this.phases()
      .flatMap((p) => [this.time(p.scheduledStartDate), this.time(p.scheduledEndDate)])
      .filter((v) => v > 0);
    return { start: Math.min(...values), end: Math.max(...values) };
  });
  private time(value: string | number | undefined) {
    return value ? new Date(value).getTime() : 0;
  }
  offset(p: Phase) {
    const b = this.bounds();
    return Math.max(
      0,
      Math.min(
        98,
        ((this.time(p.scheduledStartDate) - b.start) / Math.max(1, b.end - b.start)) * 100,
      ),
    );
  }
  width(p: Phase) {
    const b = this.bounds();
    return Math.max(
      2,
      Math.min(
        100 - this.offset(p),
        ((this.time(p.scheduledEndDate) - this.time(p.scheduledStartDate)) /
          Math.max(1, b.end - b.start)) *
          100,
      ),
    );
  }
}
