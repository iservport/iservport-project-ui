import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-project-template-home',
  imports: [RouterLink],
  templateUrl: './project-template-home.component.html',
  styleUrl: './project-template-home.component.css'
})
export class ProjectTemplateHomeComponent {
  readonly templates = [
    {
      id: 'topic-discovery',
      title: 'Discovery project',
      topic: 'Planning'
    },
    {
      id: 'topic-delivery',
      title: 'Delivery project',
      topic: 'Execution'
    }
  ];
}
