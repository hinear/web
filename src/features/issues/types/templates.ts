import type { IssuePriority, IssueStatus } from "../types";

export interface IssueTemplate {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  titleTemplate: string;
  defaultStatus: IssueStatus;
  defaultPriority: IssuePriority | null;
  defaultLabels: string[];
  defaultDescription: string | null;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIssueTemplateInput {
  projectId: string;
  name: string;
  description?: string;
  titleTemplate: string;
  defaultStatus?: IssueStatus;
  defaultPriority?: IssuePriority | null;
  defaultLabels?: string[];
  defaultDescription?: string;
  createdBy: string;
}

export interface UpdateIssueTemplateInput {
  name?: string;
  description?: string;
  titleTemplate?: string;
  defaultStatus?: IssueStatus;
  defaultPriority?: IssuePriority | null;
  defaultLabels?: string[];
  defaultDescription?: string;
  isActive?: boolean;
}

export interface IssueTemplateRepository {
  getTemplateById(templateId: string): Promise<IssueTemplate | null>;
  getTemplatesByProject(projectId: string): Promise<IssueTemplate[]>;
  getActiveTemplatesByProject(projectId: string): Promise<IssueTemplate[]>;
  createTemplate(input: CreateIssueTemplateInput): Promise<IssueTemplate>;
  updateTemplate(
    templateId: string,
    input: UpdateIssueTemplateInput
  ): Promise<IssueTemplate>;
  deleteTemplate(templateId: string): Promise<void>;

  /**
   * 템플릿에서 이슈 생성을 위한 데이터 생성
   */
  applyTemplate(
    templateId: string,
    title: string
  ): Promise<{
    title: string;
    description: string | null;
    status: IssueStatus;
    priority: IssuePriority | null;
    labels: string[];
  }>;
}
