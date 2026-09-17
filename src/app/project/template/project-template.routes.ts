import type { Routes } from '@angular/router';
export const projectTemplateRoutes: Routes = [
  {
    path: 'template',
    pathMatch: 'full',
    data: { templates: true },
    loadComponent: () =>
      import('./project-template-home.component').then((m) => m.ProjectTemplateHomeComponent),
  },
  {
    path: 'template/id/:templateId',
    loadComponent: () =>
      import('../shared/project-shell.component').then((m) => m.ProjectShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./project-template-container.component').then(
            (m) => m.ProjectTemplateContainerComponent,
          ),
      },
    ],
  },
];
