import { Component, input } from '@angular/core';
import { I18nPipe } from '@iservport/iservport-angular-ui';
import type { ProjectStats } from '../../api/project/project.model';
@Component({
  selector: 'project-progress',
  imports: [I18nPipe],
  template: `<div
    class="progress board-card__progress"
    role="group"
    [attr.aria-label]="'PROJECT_PROGRESS' | i18n"
  >
    @for (segment of segments; track segment.key) {
      <span
        class="progress-bar"
        [class]="segment.color"
        [style.width.%]="value(segment.key)"
        [attr.title]="(segment.label | i18n) + ': ' + value(segment.key) + '%'"
        [attr.aria-label]="(segment.label | i18n) + ': ' + value(segment.key) + '%'"
      ></span>
    }
  </div>`,
  styles: `
    :host {
      display: block;
      width: 100%;
    }
    .board-card__progress {
      width: 100%;
      height: 7px;
      overflow: hidden;
      border-radius: 999px;
      background: #eef2f6;
    }
  `,
})
export class ProjectProgressComponent {
  readonly progress = input<Partial<ProjectStats['progress']> | undefined>();
  readonly segments = [
    { key: 'toDo', label: 'PROJECT_TODO', color: 'bg-secondary' },
    { key: 'doing', label: 'PROJECT_DOING', color: 'bg-primary' },
    { key: 'waiting', label: 'PROJECT_WAITING', color: 'bg-warning' },
    { key: 'done', label: 'PROJECT_DONE', color: 'bg-success' },
  ] as const;
  value(key: keyof ProjectStats['progress']) {
    return Math.max(0, Math.min(100, Number(this.progress()?.[key]) || 0));
  }
}
