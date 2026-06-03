import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-project-page-shell',
  imports: [RouterLink],
  templateUrl: './project-page-shell.component.html',
  styleUrl: './project-page-shell.component.css'
})
export class ProjectPageShellComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly active = input<string>('projects');
}
