import { Component, input } from '@angular/core';

import { ProjectPageShellComponent } from '../shared/project-page-shell.component';
import { ProjectPlaceholderPanelComponent } from '../shared/project-placeholder-panel.component';

@Component({
  selector: 'app-project-container',
  imports: [ProjectPageShellComponent, ProjectPlaceholderPanelComponent],
  templateUrl: './project-container.component.html',
  styleUrl: './project-container.component.css'
})
export class ProjectContainerComponent {
  readonly projectId = input.required<string>();
}
