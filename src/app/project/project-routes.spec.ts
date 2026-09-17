import { vi } from 'vitest';
// Route structure tests do not instantiate the third-party UI bundle or its CSS.
vi.mock('@iservport/iservport-angular-ui', () => ({}));
import { projectRoutes } from './home/project.routes';
import { projectTemplateRoutes } from './template/project-template.routes';
import { backendFilter, projectFilter, projectTopNavigationWithout } from '../project.config';

describe('Project navigation contract', () => {
  it('gives every registered detail URL a shell and a full-match child', () => {
    const routes = [...projectRoutes, ...projectTemplateRoutes];
    for (const path of [
      'project/:projectId',
      'schedule/:projectId',
      'id/:reportId',
      'content/:reportId',
      'conclusion/:projectId',
      'team/:projectId',
      'template/id/:templateId',
    ]) {
      const route = routes.find((r) => r.path === path);
      expect(route?.loadComponent).toBeDefined();
      expect(route?.children).toHaveLength(1);
      expect(route?.children?.[0].path).toBe('');
      expect(route?.children?.[0].pathMatch).toBe('full');
      expect(route?.children?.[0].loadComponent).toBeDefined();
    }
  });
  it('hides active home navigation without mutating the other home menu', () => {
    expect(projectTopNavigationWithout('project').sections).toEqual(['template', 'auth']);
    expect(projectTopNavigationWithout('template').sections).toEqual(['project', 'auth']);
    expect(projectTopNavigationWithout('project').base).toBe('/project/');
  });
  it('maps section selections to the backend checked-list DTO without losing search', () => {
    const filter = projectFilter();
    filter.search = 'alpha';
    filter.sections[0].checked = [17];
    expect(backendFilter(filter)).toMatchObject({
      search: 'alpha',
      categories: { checked: [17] },
      resolutions: { checked: ['TODO', 'DOING', 'DONE'] },
      pageSize: 24,
    });
    expect(backendFilter(filter)).not.toHaveProperty('sections');
  });
});
