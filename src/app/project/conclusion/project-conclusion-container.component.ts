import { Component } from '@angular/core';
import { ProjectContainerComponent } from '../container/project-container.component';
@Component({
  selector: 'project-conclusion-container',
  imports: [ProjectContainerComponent],
  template: `<project-summary-container [conclusion]="true" />`,
})
export class ProjectConclusionContainerComponent {}
