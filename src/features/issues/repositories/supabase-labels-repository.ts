import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";
import { createLabelKey, getLabelColor } from "@/features/issues/lib/labels";
import type { AppSupabaseServerClient } from "@/lib/supabase/server-client";
import type { TableRow } from "@/lib/supabase/types";

export interface Label {
  id: string;
  projectId: string;
  name: string;
  color: string;
  createdBy: string | null;
  createdAt: string;
}

function assertQuerySucceeded(
  context: string,
  error: PostgrestError | null
): void {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
}

function mapLabel(row: TableRow<"labels">): Label {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    color: row.color,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function isLabelRow(value: unknown): value is TableRow<"labels"> {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      "name" in value &&
      "color" in value
  );
}

export class SupabaseLabelsRepository {
  private client: AppSupabaseServerClient;

  constructor(client: AppSupabaseServerClient) {
    this.client = client;
  }

  /**
   * 프로젝트의 모든 라벨 조회
   */
  async getLabelsByProject(projectId: string): Promise<Label[]> {
    const { data, error } = await this.client
      .from("labels")
      .select()
      .eq("project_id", projectId)
      .order("name", { ascending: true });

    assertQuerySucceeded("Failed to get labels by project", error);

    return (data ?? []).map(mapLabel);
  }

  /**
   * 라벨 ID로 조회
   */
  async getLabelById(labelId: string): Promise<Label | null> {
    const { data, error } = await this.client
      .from("labels")
      .select()
      .eq("id", labelId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to get label: ${error.message}`);
    }

    return data ? mapLabel(data) : null;
  }

  /**
   * 새 라벨 생성
   */
  async createLabel(input: {
    projectId: string;
    name: string;
    createdBy: string;
  }): Promise<Label> {
    // name_key 생성
    const nameKey = createLabelKey(input.name);
    const color = getLabelColor(nameKey);

    const { data, error } = await this.client
      .from("labels")
      .insert({
        project_id: input.projectId,
        name: input.name,
        name_key: nameKey,
        color,
        created_by: input.createdBy,
      })
      .select()
      .single();

    assertQuerySucceeded("Failed to create label", error);

    if (!data) {
      throw new Error("Failed to create label: No data returned");
    }

    return mapLabel(data);
  }

  /**
   * 라벨 삭제
   */
  async deleteLabel(labelId: string): Promise<void> {
    const { error } = await this.client
      .from("labels")
      .delete()
      .eq("id", labelId);

    assertQuerySucceeded("Failed to delete label", error);
  }

  /**
   * 이슈의 라벨 조회
   */
  async getIssueLabels(issueId: string): Promise<Label[]> {
    const { data, error } = await this.client
      .from("issue_labels")
      .select("labels(*)")
      .eq("issue_id", issueId);

    assertQuerySucceeded("Failed to get issue labels", error);

    const labels: Label[] = [];
    for (const row of data ?? []) {
      const relatedLabel = row.labels as unknown;
      if (isLabelRow(relatedLabel)) {
        labels.push(mapLabel(relatedLabel));
      }
    }

    return labels;
  }

  /**
   * 이슈에 라벨 추가
   */
  async addLabelToIssue(
    issueId: string,
    projectId: string,
    labelId: string
  ): Promise<void> {
    const { error } = await this.client.from("issue_labels").insert({
      issue_id: issueId,
      project_id: projectId,
      label_id: labelId,
    });

    assertQuerySucceeded("Failed to add label to issue", error);
  }

  /**
   * 이슈에서 라벨 제거
   */
  async removeLabelFromIssue(issueId: string, labelId: string): Promise<void> {
    const { error } = await this.client
      .from("issue_labels")
      .delete()
      .eq("issue_id", issueId)
      .eq("label_id", labelId);

    assertQuerySucceeded("Failed to remove label from issue", error);
  }

  /**
   * 이슈의 라벨 일괄 업데이트
   */
  async updateIssueLabels(
    issueId: string,
    projectId: string,
    labelIds: string[]
  ): Promise<void> {
    // 현재 라벨 조회
    const { data: currentLabels, error: fetchError } = await this.client
      .from("issue_labels")
      .select("label_id")
      .eq("issue_id", issueId);

    assertQuerySucceeded("Failed to fetch current labels", fetchError);

    const currentLabelIds = currentLabels?.map((row) => row.label_id) ?? [];

    // 제거할 라벨
    const toRemove = currentLabelIds.filter((id) => !labelIds.includes(id));
    // 추가할 라벨
    const toAdd = labelIds.filter((id) => !currentLabelIds.includes(id));

    // 라벨 제거
    if (toRemove.length > 0) {
      const { error: removeError } = await this.client
        .from("issue_labels")
        .delete()
        .eq("issue_id", issueId)
        .in("label_id", toRemove);

      assertQuerySucceeded("Failed to remove labels", removeError);
    }

    // 라벨 추가
    if (toAdd.length > 0) {
      const inserts = toAdd.map((labelId) => ({
        issue_id: issueId,
        project_id: projectId,
        label_id: labelId,
      }));

      const { error: addError } = await this.client
        .from("issue_labels")
        .insert(inserts);

      assertQuerySucceeded("Failed to add labels", addError);
    }
  }
}
