import type { Routes } from '@angular/router';
import { CUSTOM_AUTH_WORKSPACE } from '@iservport/iservport-angular-ui';
import { projectRoutes } from './project/home/project.routes';
import { projectTemplateRoutes } from './project/template/project-template.routes';
export const routes: Routes = [
  {
    path: 'start',
    loadComponent: () => import('@iservport/iservport-angular-ui').then((m) => m.StartComponent),
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('@iservport/iservport-angular-ui').then((m) => m.CustomAuthComponent),
    providers: [{ provide: CUSTOM_AUTH_WORKSPACE, useValue: 'PROJECT' }],
  },
  ...projectTemplateRoutes,
  ...projectRoutes,
  { path: 'light/:projectId', redirectTo: 'schedule/:projectId' },
  { path: 'report/:reportId', redirectTo: 'id/:reportId' },
  { path: ':projectId', redirectTo: 'project/:projectId' },
];
