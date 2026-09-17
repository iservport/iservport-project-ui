import { ProjectProgressComponent } from '../shared/project-progress.component';
import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  CustomStatsComponent,
  CustomTopBoardNavigationComponent,
  CustomPaginationComponent,
  CustomSearchBarComponent,
  I18nPipe,
} from '@iservport/iservport-angular-ui';
import { ProjectHomeStore } from '../home/project-home.store';
import { projectTopNavigationWithout } from '../../project.config';
import { ProjectEditorComponent } from '../shared/project-editor.component';
import { statusLabel } from '../shared/project-fields';
import type { Project, ProjectTemplate } from '../../api/project/project.model';
@Component({
  selector: 'project-board',
  imports: [
    ProjectProgressComponent,
    RouterLink,
    DatePipe,
    CustomStatsComponent,
    CustomTopBoardNavigationComponent,
    CustomPaginationComponent,
    CustomSearchBarComponent,
    I18nPipe,
    ProjectEditorComponent,
  ],
  templateUrl: './project-board.component.html',
  styleUrl: './project-board.component.css',
})
export class ProjectBoardComponent {
  readonly store = inject(ProjectHomeStore);
  readonly navigation = projectTopNavigationWithout(this.store.templates ? 'template' : 'project');
  readonly statusLabel = statusLabel;
  title(item: Project | ProjectTemplate) {
    return String(item['folderName'] || item['templateName'] || '');
  }
  code(item: Project | ProjectTemplate) {
    return String(item['folderCode'] || item['patternPrefix'] || item['templateCode'] || '');
  }
  date(item: Project | ProjectTemplate) {
    return item['endDate'] as string | number | undefined;
  }
  status(item: Project | ProjectTemplate) {
    return statusLabel(item['resolution'] as string | undefined);
  }
}
