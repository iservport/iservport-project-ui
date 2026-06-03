import { Component } from '@angular/core';

import { ProjectBoardComponent } from '../board/project-board.component';

@Component({
  selector: 'app-project-home',
  imports: [ProjectBoardComponent],
  templateUrl: './project-home.component.html',
  styleUrl: './project-home.component.css'
})
export class ProjectHomeComponent {}
