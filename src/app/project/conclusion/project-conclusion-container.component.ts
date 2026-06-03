import { Component, input } from '@angular/core';

import { ProjectPageShellComponent } from '../shared/project-page-shell.component';
import { ProjectPlaceholderPanelComponent } from '../shared/project-placeholder-panel.component';

@Component({
  selector: 'app-project-conclusion-container',
  imports: [ProjectPageShellComponent, ProjectPlaceholderPanelComponent],
  templateUrl: './project-conclusion-container.component.html',
  styleUrl: './project-conclusion-container.component.css'
})
export class ProjectConclusionContainerComponent {
  readonly projectId = input.required<string>();
}
