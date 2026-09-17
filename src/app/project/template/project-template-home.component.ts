import { Component } from '@angular/core';
import { ProjectHomeComponent } from '../home/project-home.component';
@Component({
  selector: 'project-template-home',
  imports: [ProjectHomeComponent],
  template: `<project-home />`,
})
export class ProjectTemplateHomeComponent {}
