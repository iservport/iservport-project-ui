export const PROJECT_CONFIG = {
  module: 'project',
  apiRoot: '/app/project',
  filters: {
    home: 'PROJECT_HOME_FILTER',
    topic: 'PROJECT_TOPIC_FILTER',
    light: 'PROJECT_LIGHT_FILTER',
    phase: 'PROJECT_PHASE_FILTER',
    report: 'PROJECT_REPORT_FILTER'
  }
} as const;
