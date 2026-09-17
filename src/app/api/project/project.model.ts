export type Id = number;
export interface Entity {
  id: Id;
  version?: number;
  [key: string]: unknown;
}
export interface Project extends Entity {
  categoryId: number;
  folderCode: string;
  folderName: string;
  nature: string;
  resolution: string;
  priority: string;
  ownerId?: number;
  startDate?: string | number;
  endDate?: string | number;
  contentAsString?: string;
  conclusion?: string;
  benefits?: string;
  assumptions?: string;
  deliverables?: string;
  constraints?: string;
  privacyLevel?: string;
  patternPrefix?: string;
}
export interface Phase extends Entity {
  projectId: number;
  reportFolderId?: number;
  literal: string;
  phaseName: string;
  scheduledStartDate?: string | number;
  scheduledEndDate?: string | number;
  contentAsString?: string;
  phaseFormat?: string;
  priority?: string;
}
export interface Report extends Entity {
  projectId?: number;
  reportFolderId: number;
  reportPhaseId: number;
  reportCode: string;
  summary: string;
  taskDesc?: string;
  resolution: string;
  complete: number;
  priority: string;
  scheduledStartDate?: string | number;
  scheduledEndDate?: string | number;
  reporterId?: number;
}
export interface Review extends Entity {
  reportId: number;
  reviewSummary: string;
  reviewText: string;
  reviewType: string;
  complete: number;
  issueDate?: string | number;
}
export interface ProjectTemplate extends Entity {
  categoryId: number;
  templateCode: string;
  templateName: string;
  workspace: string;
  templateType: string;
  priority: string;
  externalLogoUrl?: string;
  content?: string;
}
export interface TemplateContent extends Entity {
  templateId: number;
  parentId: number;
  templateContentType: string;
  name: string;
  sequence: number;
  duration: number;
  templateContent?: string;
  scriptId?: number;
}
export interface TeamMember extends Entity {
  userId: number;
  identityId?: number;
  displayName: string;
  staffRole: string;
  staffGrade: string;
  workflowLevel?: number;
  reportFolderId?: number;
}
export interface Category extends Entity {
  categoryName: string;
}
export interface ContentLink extends Entity {
  contentId: number;
  reportId: number;
  docCode: string;
  docName: string;
  docAbstract?: string;
  summary?: string;
}
export interface ContentRecord extends Entity {
  docCode: string;
  docName: string;
}
export interface UserOption extends Entity {
  displayName: string;
  identityId?: number;
}
export interface Page<T> {
  content: T[];
  number: number;
  size: number;
  totalPages: number;
  totalElements: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
}
export function emptyPage<T>(): Page<T> {
  return {
    content: [],
    number: 0,
    size: 24,
    totalPages: 0,
    totalElements: 0,
    numberOfElements: 0,
    first: true,
    last: true,
  };
}

export interface ProjectStats {
  id: number;
  total: number;
  overdue: number;
  alert: number;
  progress: { toDo: number; doing: number; waiting: number; done: number };
}
