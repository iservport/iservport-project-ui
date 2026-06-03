import { Component, input } from '@angular/core';

import { ProjectPageShellComponent } from '../shared/project-page-shell.component';
import { ProjectPlaceholderPanelComponent } from '../shared/project-placeholder-panel.component';

@Component({
  selector: 'app-project-team-container',
  imports: [ProjectPageShellComponent, ProjectPlaceholderPanelComponent],
  templateUrl: './project-team-container.component.html',
  styleUrl: './project-team-container.component.css'
})
export class ProjectTeamContainerComponent {
  readonly projectId = input.required<string>();
}
