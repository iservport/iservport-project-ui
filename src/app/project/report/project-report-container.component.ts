import { Component, input } from '@angular/core';

import { ProjectPageShellComponent } from '../shared/project-page-shell.component';
import { ProjectPlaceholderPanelComponent } from '../shared/project-placeholder-panel.component';

@Component({
  selector: 'app-project-report-container',
  imports: [ProjectPageShellComponent, ProjectPlaceholderPanelComponent],
  templateUrl: './project-report-container.component.html',
  styleUrl: './project-report-container.component.css'
})
export class ProjectReportContainerComponent {
  readonly reportId = input.required<string>();
}
