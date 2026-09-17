import type { EditorField } from './project-editor.component';
export const statusOptions = ['TODO', 'DOING', 'DONE', 'CANCELED'].map((value) => ({
  value,
  label: 'PROJECT_' + value,
}));
export const priorityOptions = [
  { value: '0', label: 'PROJECT_URGENT' },
  { value: '1', label: 'PROJECT_IMPORTANT' },
  { value: '2', label: 'PROJECT_OPTIONAL' },
  { value: '9', label: 'PROJECT_ARCHIVED' },
];
export const projectFields: EditorField[] = [
  { key: 'folderCode', label: 'PROJECT_CODE', required: true },
  { key: 'folderName', label: 'PROJECT_NAME', required: true },
  { key: 'startDate', label: 'PROJECT_START', type: 'date' },
  { key: 'endDate', label: 'PROJECT_END', type: 'date' },
  { key: 'resolution', label: 'PROJECT_STATUS', type: 'select', options: statusOptions },
  { key: 'priority', label: 'PROJECT_PRIORITY', type: 'select', options: priorityOptions },
  { key: 'patternPrefix', label: 'PROJECT_PREFIX' },
  {
    key: 'privacyLevel',
    label: 'PROJECT_PRIVACY',
    type: 'select',
    options: [
      { value: '0', label: 'PROJECT_PUBLIC' },
      { value: '1', label: 'PROJECT_TEAM' },
      { value: '2', label: 'PROJECT_OWNER' },
      { value: '9', label: 'PROJECT_RESTRICTED' },
    ],
  },
];
export const phaseFields: EditorField[] = [
  { key: 'literal', label: 'PROJECT_CODE', required: true },
  { key: 'phaseName', label: 'PROJECT_NAME', required: true },
  { key: 'scheduledStartDate', label: 'PROJECT_START', type: 'date' },
  { key: 'scheduledEndDate', label: 'PROJECT_END', type: 'date' },
  {
    key: 'phaseFormat',
    label: 'PROJECT_VIEW',
    type: 'select',
    options: [
      { value: 'BOARD', label: 'PROJECT_BOARD' },
      { value: 'TABLE', label: 'PROJECT_TABLE' },
    ],
  },
  { key: 'contentAsString', label: 'PROJECT_DESCRIPTION', type: 'richtext' },
];
export const reportFields: EditorField[] = [
  { key: 'summary', label: 'PROJECT_NAME', required: true },
  { key: 'taskDesc', label: 'PROJECT_DESCRIPTION', type: 'richtext' },
  { key: 'scheduledStartDate', label: 'PROJECT_START', type: 'date' },
  { key: 'scheduledEndDate', label: 'PROJECT_END', type: 'date' },
  { key: 'priority', label: 'PROJECT_PRIORITY', type: 'select', options: priorityOptions },
  { key: 'complete', label: 'PROJECT_COMPLETE', type: 'number', min: 0, max: 100 },
  {
    key: 'resolution',
    label: 'PROJECT_STATUS',
    type: 'select',
    options: [
      { value: 'P', label: 'PROJECT_TODO' },
      { value: 'T', label: 'PROJECT_DOING' },
      { value: 'D', label: 'PROJECT_DONE' },
    ],
  },
];
export const reviewFields: EditorField[] = [
  { key: 'reviewSummary', label: 'PROJECT_SUMMARY', required: true },
  { key: 'reviewText', label: 'PROJECT_DESCRIPTION', type: 'richtext' },
  { key: 'complete', label: 'PROJECT_COMPLETE', type: 'number', min: 0, max: 100 },
  {
    key: 'reviewType',
    label: 'PROJECT_TYPE',
    type: 'select',
    options: ['REVIEW', 'CONCLUSION', 'RESTART', 'CANCELED'].map((value) => ({
      value,
      label: 'PROJECT_' + value,
    })),
  },
];
export const templateFields: EditorField[] = [
  { key: 'templateCode', label: 'PROJECT_CODE', required: true },
  { key: 'templateName', label: 'PROJECT_NAME', required: true },
  { key: 'templateType', label: 'PROJECT_TYPE' },
  { key: 'name', label: 'PROJECT_DEFAULT_NAME' },
  { key: 'priority', label: 'PROJECT_PRIORITY', type: 'select', options: priorityOptions },
];
export const templateContentFields: EditorField[] = [
  { key: 'name', label: 'PROJECT_NAME', required: true },
  { key: 'duration', label: 'PROJECT_DURATION', type: 'number', min: 1, required: true },
  { key: 'sequence', label: 'PROJECT_SEQUENCE', type: 'number', min: 0 },
  { key: 'templateContent', label: 'PROJECT_DESCRIPTION', type: 'richtext' },
];
export function statusLabel(value: string | undefined) {
  return (
    'PROJECT_' +
    ({ P: 'TODO', T: 'DOING', D: 'DONE', X: 'CANCELED', W: 'SUSPENDED', F: 'FORECAST' }[
      value || ''
    ] ||
      value ||
      'TODO')
  );
}
