import { Component, input } from '@angular/core';

@Component({
  selector: 'app-project-placeholder-panel',
  templateUrl: './project-placeholder-panel.component.html',
  styleUrl: './project-placeholder-panel.component.css'
})
export class ProjectPlaceholderPanelComponent {
  readonly label = input.required<string>();
  readonly description = input<string>('');
}
