import { Component, input } from '@angular/core';

import { ProjectPageShellComponent } from '../shared/project-page-shell.component';
import { ProjectPlaceholderPanelComponent } from '../shared/project-placeholder-panel.component';

@Component({
  selector: 'app-project-phase-container',
  imports: [ProjectPageShellComponent, ProjectPlaceholderPanelComponent],
  templateUrl: './project-phase-container.component.html',
  styleUrl: './project-phase-container.component.css'
})
export class ProjectPhaseContainerComponent {
  readonly phaseId = input.required<string>();
}
