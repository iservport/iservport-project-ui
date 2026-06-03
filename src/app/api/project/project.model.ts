export interface Project {
  id: string;
  code: string;
  title: string;
  status: string;
  owner?: string;
  updatedAt?: string;
}

export interface ProjectTemplate {
  id: string;
  title: string;
  topic: string;
  status: string;
}
