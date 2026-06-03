import { Component, input } from '@angular/core';

import { ProjectPageShellComponent } from '../shared/project-page-shell.component';
import { ProjectPlaceholderPanelComponent } from '../shared/project-placeholder-panel.component';

@Component({
  selector: 'app-project-light-container',
  imports: [ProjectPageShellComponent, ProjectPlaceholderPanelComponent],
  templateUrl: './project-light-container.component.html',
  styleUrl: './project-light-container.component.css'
})
export class ProjectLightContainerComponent {
  readonly projectId = input.required<string>();
}
