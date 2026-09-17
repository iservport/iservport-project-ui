import { Component, inject } from '@angular/core';
import { CustomHomeShellComponent } from '@iservport/iservport-angular-ui';
import { ProjectHomeStore } from './project-home.store';
import { ProjectBoardComponent } from '../board/project-board.component';
@Component({
  selector: 'project-home',
  imports: [CustomHomeShellComponent, ProjectBoardComponent],
  providers: [ProjectHomeStore],
  template: ` <custom-home-shell
    [filter]="store.filter()"
    [title]="store.templates ? 'PROJECT_TEMPLATES' : 'PROJECTS'"
    [showAside]="false"
    (filterChange)="store.updateFilter($event)"
  >
    <project-board customHomeMain />
  </custom-home-shell>`,
})
export class ProjectHomeComponent {
  readonly store = inject(ProjectHomeStore);
}
