import { Routes } from '@angular/router';

import { ProjectConclusionContainerComponent } from './project/conclusion/project-conclusion-container.component';
import { ProjectContainerComponent } from './project/container/project-container.component';
import { ProjectHomeComponent } from './project/home/project-home.component';
import { ProjectLightContainerComponent } from './project/light/project-light-container.component';
import { ProjectPhaseContainerComponent } from './project/phase/project-phase-container.component';
import { ProjectReportContainerComponent } from './project/report/project-report-container.component';
import { ProjectTeamContainerComponent } from './project/team/project-team-container.component';
import { ProjectTemplateHomeComponent } from './project/template/project-template-home.component';

export const routes: Routes = [
  {
    path: '',
    component: ProjectHomeComponent
  },
  {
    path: 'template',
    component: ProjectTemplateHomeComponent
  },
  {
    path: 'light/:projectId',
    component: ProjectLightContainerComponent
  },
  {
    path: 'phase/:phaseId',
    component: ProjectPhaseContainerComponent
  },
  {
    path: 'report/:reportId',
    component: ProjectReportContainerComponent
  },
  {
    path: 'conclusion/:projectId',
    component: ProjectConclusionContainerComponent
  },
  {
    path: 'team/:projectId',
    component: ProjectTeamContainerComponent
  },
  {
    path: ':projectId',
    component: ProjectContainerComponent
  }
];
