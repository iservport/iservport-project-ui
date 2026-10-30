import type { FilterContainerModel } from '@iservport/iservport-angular-ui';
import type { Phase, Report, TeamMember } from '../../api/project/project.model';
import { phaseFields, reportFields } from '../shared/project-fields';
import type { EditorField } from '../shared/project-editor.component';

export function actionPlanFilter(phases: Phase[], team: TeamMember[], phaseId = 0): FilterContainerModel {
  return {
    workspace: 'PROJECT',
    search: '',
    hideSearch: true,
    sections: [
      {
        key: 'phases', caption: 'PROJECT_5W2H_AREAS',
        labels: Object.fromEntries(phases.map((p) => [p.id, p.phaseName])),
        checked: [phases.find((p) => p.id === phaseId)?.id || phases[0]?.id].filter((id): id is number => !!id),
      },
      {
        key: 'resolutions', caption: 'PROJECT_STATUS', checked: ['P', 'T', 'D'],
        labels: { P: 'PROJECT_TODO', T: 'PROJECT_DOING', D: 'PROJECT_DONE' },
      },
      {
        key: 'team', caption: 'PROJECT_5W2H_WHO',
        labels: Object.fromEntries(team.filter((m) => m.identityId).map((m) => [m.identityId, m.displayName])),
        checked: team.flatMap((m) => m.identityId ? [m.identityId] : []),
      },
      {
        key: 'priorities', caption: 'PROJECT_PRIORITY', checked: ['0', '1', '2'],
        labels: { '0': 'PROJECT_URGENT', '1': 'PROJECT_IMPORTANT', '2': 'PROJECT_OPTIONAL', '9': 'PROJECT_ARCHIVED' },
      },
      {
        key: 'ordering', caption: 'PROJECT_SORT', radio: true, checked: ['internalNumber'],
        labels: { internalNumber: 'PROJECT_CODE', nextCheckDate: 'PROJECT_5W2H_CHECK' },
      },
    ],
  };
}

export const actionPlanPhaseFields: EditorField[] = phaseFields
  .filter((field) => field.key !== 'phaseFormat')
  .map((field) => field.key === 'phaseName' ? { ...field, label: 'PROJECT_5W2H_WHERE' } : field);

// Legacy combines How and How much in taskDetail; there is no separate cost field.
export function actionPlanReportFields(phases: Phase[], team: TeamMember[], report?: Report): EditorField[] {
  const phaseOptions = phases.map((p) => ({ value: p.id, label: p.phaseName, literal: true }));
  const teamOptions = team.filter((m) => m.identityId).map((m) => ({
    value: m.identityId!, label: m.displayName, literal: true,
  }));
  if (report?.reporterId && !teamOptions.some((o) => o.value === report.reporterId)) {
    teamOptions.push({ value: report.reporterId, label: String(report.reporterId), literal: true });
  }
  if (report?.reportPhaseId && !phaseOptions.some((o) => o.value === report.reportPhaseId)) {
    phaseOptions.push({ value: report.reportPhaseId, label: report.phaseName || String(report.reportPhaseId), literal: true });
  }
  return [
    reportFields[0],
    { key: 'taskDesc', label: 'PROJECT_5W2H_WHAT', type: 'richtext' },
    { key: 'taskCause', label: 'PROJECT_5W2H_WHY', type: 'richtext' },
    { key: 'reportPhaseId', label: 'PROJECT_5W2H_WHERE', type: 'select', required: true, options: phaseOptions },
    { key: 'reporterId', label: 'PROJECT_5W2H_WHO', type: 'select', options: teamOptions },
    ...reportFields.filter((f) => ['scheduledStartDate', 'scheduledEndDate'].includes(f.key)),
    { key: 'nextCheckDate', label: 'PROJECT_5W2H_CHECK', type: 'date' },
    { key: 'taskDetail', label: 'PROJECT_5W2H_HOW_COST', type: 'richtext' },
    ...reportFields.filter((f) => ['priority', 'complete', 'resolution'].includes(f.key)),
  ];
}
