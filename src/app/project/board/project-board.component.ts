import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface ProjectCard {
  id: string;
  code: string;
  title: string;
  status: string;
  owner: string;
}

@Component({
  selector: 'app-project-board',
  imports: [RouterLink],
  templateUrl: './project-board.component.html',
  styleUrl: './project-board.component.css'
})
export class ProjectBoardComponent {
  readonly cards: ProjectCard[] = [
    {
      id: 'project-demo',
      code: 'PRJ-001',
      title: 'Project workspace',
      status: 'Active',
      owner: 'Operations'
    },
    {
      id: 'project-review',
      code: 'PRJ-002',
      title: 'Review cycle',
      status: 'In review',
      owner: 'Project office'
    }
  ];
}
