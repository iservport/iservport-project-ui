import { Component, inject } from '@angular/core';
import { CustomHomeShellComponent } from '@iservport/iservport-angular-ui';
import { ProjectHomeStore } from './project-home.store';
import { ProjectBoardComponent } from '../board/project-board.component';
import { ProjectUiChoiceComponent } from '../shared/project-ui-choice.component';
@Component({
  selector: 'project-home',
  imports: [CustomHomeShellComponent, ProjectBoardComponent, ProjectUiChoiceComponent],
  providers: [ProjectHomeStore],
  template: ` <custom-home-shell
    [filter]="store.filter()"
    [title]="store.templates ? 'PROJECT_TEMPLATES' : 'PROJECTS'"
    [showAside]="false"
    [disabled]="!store.templates && !store.uiChoiceReady()"
    (filterChange)="store.updateFilter($event)"
  >
    <project-board customHomeMain />
  </custom-home-shell>
  @if (!store.templates) { <project-ui-choice /> }`,
})
export class ProjectHomeComponent {
  readonly store = inject(ProjectHomeStore);
}
