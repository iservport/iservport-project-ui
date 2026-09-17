import type { Routes } from '@angular/router';
const shell = () =>
  import('../shared/project-shell.component').then((m) => m.ProjectShellComponent);
export const projectRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./project-home.component').then((m) => m.ProjectHomeComponent),
  },
  {
    path: 'project/:projectId',
    loadComponent: shell,
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('../container/project-container.component').then(
            (m) => m.ProjectContainerComponent,
          ),
      },
    ],
  },
  {
    path: 'schedule/:projectId',
    loadComponent: shell,
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('../schedule/project-schedule-container.component').then(
            (m) => m.ProjectScheduleContainerComponent,
          ),
      },
    ],
  },
  {
    path: 'id/:reportId',
    loadComponent: shell,
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('../report/project-report-container.component').then(
            (m) => m.ProjectReportContainerComponent,
          ),
      },
    ],
  },
  {
    path: 'content/:reportId',
    loadComponent: shell,
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('../content/project-content-container.component').then(
            (m) => m.ProjectContentContainerComponent,
          ),
      },
    ],
  },
  {
    path: 'conclusion/:projectId',
    loadComponent: shell,
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('../conclusion/project-conclusion-container.component').then(
            (m) => m.ProjectConclusionContainerComponent,
          ),
      },
    ],
  },
  {
    path: 'team/:projectId',
    loadComponent: shell,
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('../team/project-team-container.component').then(
            (m) => m.ProjectTeamContainerComponent,
          ),
      },
    ],
  },
];
