import type {
  CustomTopBoardNavigationComponent,
  FilterContainerModel,
} from '@iservport/iservport-angular-ui';
export const PROJECT_CONFIG = {
  module: 'project',
  apiRoot: '/app/report',
  base: '/project/',
} as const;
export const PROJECT_TOP_MENU_CONFIG: NonNullable<CustomTopBoardNavigationComponent['menu']> = {
  sections: ['project', 'template', 'auth'],
  base: '/project/',
  project: { caption: 'PROJECTS', home: true, icon: 'Task-List-Multiple--Streamline-Ultimate' },
  template: { caption: 'PROJECT_TEMPLATES', icon: 'Task-List-Multiple--Streamline-Ultimate' },
  auth: { caption: '__AUTHORIZATION', icon: 'Login-Keys--Streamline-Ultimate-yellow' },
};
export function projectTopNavigationWithout(section: string) {
  return {
    ...PROJECT_TOP_MENU_CONFIG,
    sections: PROJECT_TOP_MENU_CONFIG.sections.filter((item) => item !== section),
  };
}
export function projectFilter(): FilterContainerModel {
  return {
    workspace: 'PROJECT',
    preferenceType: 'PROJECT_HOME_FILTER',
    preferenceKey: '0',
    search: '',
    hideSearch: true,
    sections: [
      {
        key: 'categories',
        caption: 'PROJECT_BOARDS',
        radio: true,
        checked: [],
        labels: {},
        workspace: 'PROJECT',
      },
      {
        key: 'resolutions',
        caption: 'PROJECT_STATUS',
        checked: ['TODO', 'DOING', 'DONE'],
        labels: {
          TODO: 'PROJECT_TODO',
          DOING: 'PROJECT_DOING',
          DONE: 'PROJECT_DONE',
          CANCELED: 'PROJECT_CANCELED',
        },
      },
      {
        key: 'priorities',
        caption: 'PROJECT_PRIORITY',
        checked: ['0', '1', '2'],
        labels: {
          '0': 'PROJECT_URGENT',
          '1': 'PROJECT_IMPORTANT',
          '2': 'PROJECT_OPTIONAL',
          '9': 'PROJECT_ARCHIVED',
        },
      },
    ],
  };
}
export function backendFilter(filter: FilterContainerModel): Record<string, unknown> {
  return {
    search: filter.search || '',
    preferenceType: filter.preferenceType,
    pageSize: 24,
    ...Object.fromEntries(
      filter.sections.map((section) => [section.key, { checked: section.checked }]),
    ),
  };
}
