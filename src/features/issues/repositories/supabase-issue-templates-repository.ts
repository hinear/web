import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";
import type {
  CreateIssueTemplateInput,
  IssueTemplate,
  IssueTemplateRepository,
  UpdateIssueTemplateInput,
} from "@/features/issues/types/templates";
import type { AppSupabaseServerClient } from "@/lib/supabase/server-client";

interface IssueTemplateRow {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  title_template: string;
  default_status: IssueTemplate["defaultStatus"];
  default_priority: IssueTemplate["defaultPriority"];
  default_labels: string[] | null;
  default_description: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface IssueTemplateInsert {
  created_by: string;
  default_description?: string;
  default_labels?: string[];
  default_priority?: IssueTemplate["defaultPriority"];
  default_status?: IssueTemplate["defaultStatus"];
  description?: string;
  name: string;
  project_id: string;
  title_template: string;
}

function assertQuerySucceeded(
  context: string,
  error: PostgrestError | null
): void {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
}

function assertDataPresent<T>(context: string, data: T | null): T {
  if (!data) {
    throw new Error(`${context}: query returned no rows.`);
  }
  return data;
}

function mapIssueTemplate(row: IssueTemplateRow): IssueTemplate {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    description: row.description,
    titleTemplate: row.title_template,
    defaultStatus: row.default_status as IssueTemplate["defaultStatus"],
    defaultPriority: row.default_priority as IssueTemplate["defaultPriority"],
    defaultLabels: (row.default_labels as string[]) ?? [],
    defaultDescription: row.default_description,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseIssueTemplatesRepository
  implements IssueTemplateRepository
{
  private client: AppSupabaseServerClient;

  constructor(client: AppSupabaseServerClient) {
    this.client = client;
  }

  async getTemplateById(templateId: string): Promise<IssueTemplate | null> {
    const { data, error } = await this.client
      .from("issue_templates")
      .select()
      .eq("id", templateId)
      .single<IssueTemplateRow>();

    if (error) {
      if (error.code === "PGRST116") {
        // Row not found
        return null;
      }
      throw new Error(`Failed to get template: ${error.message}`);
    }

    return data ? mapIssueTemplate(data) : null;
  }

  async getTemplatesByProject(projectId: string): Promise<IssueTemplate[]> {
    const { data, error } = await this.client
      .from("issue_templates")
      .select()
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    assertQuerySucceeded("Failed to get templates by project", error);

    return ((data ?? []) as IssueTemplateRow[]).map(mapIssueTemplate);
  }

  async getActiveTemplatesByProject(
    projectId: string
  ): Promise<IssueTemplate[]> {
    const { data, error } = await this.client
      .from("issue_templates")
      .select()
      .eq("project_id", projectId)
      .eq("is_active", true)
      .order("name", { ascending: true });

    assertQuerySucceeded("Failed to get active templates by project", error);

    return ((data ?? []) as IssueTemplateRow[]).map(mapIssueTemplate);
  }

  async createTemplate(
    input: CreateIssueTemplateInput
  ): Promise<IssueTemplate> {
    const insertData: IssueTemplateInsert = {
      project_id: input.projectId,
      name: input.name,
      description: input.description,
      title_template: input.titleTemplate,
      default_status: input.defaultStatus ?? "Triage",
      default_priority: input.defaultPriority,
      default_labels: input.defaultLabels ?? [],
      default_description: input.defaultDescription,
      created_by: input.createdBy,
    };

    const { data, error } = await this.client
      .from("issue_templates")
      .insert(insertData as never)
      .select()
      .single<IssueTemplateRow>();

    assertQuerySucceeded("Failed to create template", error);
    const createdTemplate = assertDataPresent(
      "Failed to create template",
      data
    );

    return mapIssueTemplate(createdTemplate);
  }

  async updateTemplate(
    templateId: string,
    input: UpdateIssueTemplateInput
  ): Promise<IssueTemplate> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined)
      updateData.description = input.description;
    if (input.titleTemplate !== undefined)
      updateData.title_template = input.titleTemplate;
    if (input.defaultStatus !== undefined)
      updateData.default_status = input.defaultStatus;
    if (input.defaultPriority !== undefined)
      updateData.default_priority = input.defaultPriority;
    if (input.defaultLabels !== undefined)
      updateData.default_labels = input.defaultLabels;
    if (input.defaultDescription !== undefined)
      updateData.default_description = input.defaultDescription;
    if (input.isActive !== undefined) updateData.is_active = input.isActive;

    const { data, error } = await this.client
      .from("issue_templates")
      .update(updateData as never)
      .eq("id", templateId)
      .select()
      .single<IssueTemplateRow>();

    assertQuerySucceeded("Failed to update template", error);
    const updatedTemplate = assertDataPresent(
      "Failed to update template",
      data
    );

    return mapIssueTemplate(updatedTemplate);
  }

  async deleteTemplate(templateId: string): Promise<void> {
    const { error } = await this.client
      .from("issue_templates")
      .delete()
      .eq("id", templateId);

    assertQuerySucceeded("Failed to delete template", error);
  }

  async applyTemplate(templateId: string, title: string) {
    const template = await this.getTemplateById(templateId);

    if (!template) {
      throw new Error("Template not found");
    }

    return {
      title: template.titleTemplate.replace("{title}", title),
      description: template.defaultDescription,
      status: template.defaultStatus,
      priority: template.defaultPriority,
      labels: template.defaultLabels,
    };
  }
}
