import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

import type {
  CreateCommentInput,
  CreateIssueInput,
  IssuesRepository,
  UpdateIssueInput,
} from "@/features/issues/contracts";
import { createLabelKey, getLabelColor } from "@/features/issues/lib/labels";
import {
  createPostgrestRepositoryError,
  createRepositoryError,
} from "@/features/issues/lib/repository-errors";
import type {
  ActivityLogEntry,
  Comment,
  ConflictError,
  Issue,
  Label,
} from "@/features/issues/types";
import type { AppSupabaseServerClient } from "@/lib/supabase/server-client";
import type {
  Json,
  TableInsert,
  TableRow,
  TableUpdate,
} from "@/lib/supabase/types";

function assertQuerySucceeded(
  context: string,
  error: PostgrestError | null
): void {
  if (error) {
    throw createPostgrestRepositoryError(context, error);
  }
}

function assertDataPresent<T>(context: string, data: T | null): T {
  if (!data) {
    throw createRepositoryError(
      "UNKNOWN",
      `${context}: query returned no rows.`
    );
  }

  return data;
}

function mapIssue(row: TableRow<"issues">): Issue {
  return {
    id: row.id,
    projectId: row.project_id,
    issueNumber: row.issue_number,
    identifier: row.identifier,
    title: row.title,
    status: row.status as Issue["status"],
    priority: row.priority as Issue["priority"],
    assigneeId: row.assignee_id,
    labels: [],
    description: row.description,
    dueDate: row.due_date,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: row.version,
  };
}

function mapLabel(row: TableRow<"labels">): Label {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
  };
}

function mapComment(row: TableRow<"comments">): Comment {
  return {
    id: row.id,
    issueId: row.issue_id,
    projectId: row.project_id,
    authorId: row.author_id,
    body: row.body,
    createdAt: row.created_at,
  };
}

function mapActivityLogEntry(row: TableRow<"activity_logs">): ActivityLogEntry {
  return {
    id: row.id,
    issueId: row.issue_id,
    projectId: row.project_id,
    actorId: row.actor_id,
    type: row.type,
    field: row.field,
    from: row.from_value,
    to: row.to_value,
    summary: row.summary,
    createdAt: row.created_at,
  };
}

function getDescriptionUpdateSummary(previous: string, next: string): string {
  if (previous.trim().length === 0 && next.trim().length > 0) {
    return "설명을 추가했습니다";
  }

  if (previous.trim().length > 0 && next.trim().length === 0) {
    return "설명을 비웠습니다";
  }

  return "설명을 업데이트했습니다";
}

export class SupabaseIssuesRepository implements IssuesRepository {
  constructor(private readonly client: AppSupabaseServerClient) {}

  async listCommentsByIssueId(issueId: string): Promise<Comment[]> {
    const { data, error } = await this.client
      .from("comments")
      .select()
      .eq("issue_id", issueId)
      .order("created_at", { ascending: false });

    assertQuerySucceeded("Failed to load issue comments", error);

    return (data ?? []).map(mapComment);
  }

  async listActivityLogByIssueId(issueId: string): Promise<ActivityLogEntry[]> {
    const { data, error } = await this.client
      .from("activity_logs")
      .select()
      .eq("issue_id", issueId)
      .order("created_at", { ascending: false });

    assertQuerySucceeded("Failed to load issue activity log", error);

    return (data ?? []).map(mapActivityLogEntry);
  }

  private async listLabelsByIssueIds(
    issueIds: string[],
    projectId: string
  ): Promise<Map<string, Label[]>> {
    if (issueIds.length === 0) {
      return new Map();
    }

    const { data: issueLabelRows, error: issueLabelError } = await this.client
      .from("issue_labels")
      .select("issue_id, label_id")
      .eq("project_id", projectId)
      .in("issue_id", issueIds);

    assertQuerySucceeded("Failed to load issue labels", issueLabelError);

    const filteredIssueLabelRows = issueLabelRows ?? [];
    const labelIds = [
      ...new Set(filteredIssueLabelRows.map((row) => row.label_id)),
    ];

    if (labelIds.length === 0) {
      return new Map(issueIds.map((issueId) => [issueId, []]));
    }

    const { data: labelRows, error: labelError } = await this.client
      .from("labels")
      .select()
      .eq("project_id", projectId)
      .in("id", labelIds);

    assertQuerySucceeded("Failed to load labels", labelError);

    const labelsById = new Map(
      (labelRows ?? []).map((row) => [row.id, mapLabel(row)])
    );
    const labelsByIssueId = new Map(
      issueIds.map((issueId) => [issueId, [] as Label[]])
    );

    for (const issueLabelRow of filteredIssueLabelRows) {
      const label = labelsById.get(issueLabelRow.label_id);

      if (!label) {
        continue;
      }

      labelsByIssueId.get(issueLabelRow.issue_id)?.push(label);
    }

    return labelsByIssueId;
  }

  private async listIssueLabels(
    issueId: string,
    projectId: string
  ): Promise<Label[]> {
    const labelsByIssueId = await this.listLabelsByIssueIds(
      [issueId],
      projectId
    );
    return labelsByIssueId.get(issueId) ?? [];
  }

  private async resolveProjectLabels(
    projectId: string,
    actorId: string,
    labelNames: string[]
  ): Promise<Label[]> {
    if (labelNames.length === 0) {
      return [];
    }

    const labelKeys = labelNames.map((name) => createLabelKey(name));
    const { data: existingRows, error: existingError } = await this.client
      .from("labels")
      .select()
      .eq("project_id", projectId)
      .in("name_key", labelKeys);

    assertQuerySucceeded("Failed to load existing labels", existingError);

    const existingByKey = new Map(
      (existingRows ?? []).map((row) => [row.name_key, mapLabel(row)])
    );

    const missingRows: TableInsert<"labels">[] = labelNames
      .filter((name) => !existingByKey.has(createLabelKey(name)))
      .map((name) => ({
        color: getLabelColor(createLabelKey(name)),
        created_by: actorId,
        name,
        name_key: createLabelKey(name),
        project_id: projectId,
      }));

    if (missingRows.length > 0) {
      const { error: insertLabelsError } = await this.client
        .from("labels")
        .insert(missingRows);

      assertQuerySucceeded("Failed to create labels", insertLabelsError);
    }

    const { data: labelRows, error: labelError } = await this.client
      .from("labels")
      .select()
      .eq("project_id", projectId)
      .in("name_key", labelKeys);

    assertQuerySucceeded("Failed to resolve labels", labelError);

    const labelsByKey = new Map(
      (labelRows ?? []).map((row) => [row.name_key, mapLabel(row)])
    );

    return labelKeys
      .map((labelKey) => labelsByKey.get(labelKey))
      .filter((label): label is Label => Boolean(label));
  }

  async createIssue(input: CreateIssueInput): Promise<Issue> {
    const { data, error } = await this.client
      .from("issues")
      .insert({
        assignee_id: input.assigneeId ?? null,
        created_by: input.createdBy,
        description: input.description ?? "",
        due_date: input.dueDate ?? null,
        priority: input.priority ?? "No Priority",
        project_id: input.projectId,
        status: input.status ?? "Triage",
        title: input.title,
        updated_by: input.createdBy,
      })
      .select()
      .single();

    assertQuerySucceeded("Failed to create issue", error);

    const issue = mapIssue(assertDataPresent("Failed to create issue", data));
    const labels = await this.resolveProjectLabels(
      input.projectId,
      input.createdBy,
      input.labels ?? []
    );

    if (labels.length > 0) {
      const { error: issueLabelsError } = await this.client
        .from("issue_labels")
        .insert(
          labels.map((label) => ({
            issue_id: issue.id,
            label_id: label.id,
            project_id: issue.projectId,
          }))
        );

      assertQuerySucceeded("Failed to link issue labels", issueLabelsError);
    }

    return {
      ...issue,
      labels,
    };
  }

  async listIssuesByProject(projectId: string): Promise<Issue[]> {
    const { data, error } = await this.client
      .from("issues")
      .select()
      .eq("project_id", projectId)
      .order("issue_number", { ascending: true });

    assertQuerySucceeded("Failed to load project issues", error);

    const issues = (data ?? []).map(mapIssue);

    // 병렬로 관련 데이터 페칭
    const [labelsByIssueId] = await Promise.all([
      this.listLabelsByIssueIds(
        issues.map((issue) => issue.id),
        projectId
      ),
    ]);

    return issues.map((issue) => ({
      ...issue,
      labels: labelsByIssueId.get(issue.id) ?? [],
    }));
  }

  async createComment(input: CreateCommentInput): Promise<Comment> {
    const { data, error } = await this.client
      .from("comments")
      .insert({
        issue_id: input.issueId,
        project_id: input.projectId,
        author_id: input.authorId,
        body: input.body,
      })
      .select()
      .single();

    assertQuerySucceeded("Failed to create comment", error);

    return mapComment(assertDataPresent("Failed to create comment", data));
  }

  async getCommentById(commentId: string): Promise<Comment> {
    const { data, error } = await this.client
      .from("comments")
      .select()
      .eq("id", commentId)
      .single();

    assertQuerySucceeded("Failed to get comment", error);

    return mapComment(assertDataPresent("Failed to get comment", data));
  }

  async updateComment(
    commentId: string,
    updates: { body: string }
  ): Promise<Comment> {
    const { data, error } = await this.client
      .from("comments")
      .update({ body: updates.body })
      .eq("id", commentId)
      .select()
      .single();

    assertQuerySucceeded("Failed to update comment", error);

    return mapComment(assertDataPresent("Failed to update comment", data));
  }

  async deleteComment(commentId: string): Promise<void> {
    const { error } = await this.client
      .from("comments")
      .delete()
      .eq("id", commentId);

    assertQuerySucceeded("Failed to delete comment", error);
  }

  async appendActivityLog(
    entry: Omit<ActivityLogEntry, "id" | "createdAt">
  ): Promise<ActivityLogEntry> {
    const { data, error } = await this.client
      .from("activity_logs")
      .insert({
        issue_id: entry.issueId,
        project_id: entry.projectId,
        actor_id: entry.actorId,
        type: entry.type,
        field: entry.field,
        from_value: (entry.from as Json | null) ?? null,
        to_value: (entry.to as Json | null) ?? null,
        summary: entry.summary,
      })
      .select()
      .single();

    assertQuerySucceeded("Failed to append activity log", error);

    return mapActivityLogEntry(
      assertDataPresent("Failed to append activity log", data)
    );
  }

  async updateIssue(issueId: string, input: UpdateIssueInput): Promise<Issue> {
    const currentIssue = await this.getIssueById(issueId);

    if (!currentIssue) {
      throw createRepositoryError("ISSUE_NOT_FOUND", "Issue not found.");
    }

    const issueUpdates: TableUpdate<"issues"> = {
      updated_by: input.updatedBy,
    };
    const activityEntries: Array<Omit<ActivityLogEntry, "id" | "createdAt">> =
      [];

    if (input.title !== undefined && input.title !== currentIssue.title) {
      issueUpdates.title = input.title;
      activityEntries.push({
        issueId: currentIssue.id,
        projectId: currentIssue.projectId,
        actorId: input.updatedBy,
        type: "issue.title.updated",
        field: "title",
        from: currentIssue.title,
        to: input.title,
        summary: `제목을 "${currentIssue.title}"에서 "${input.title}"(으)로 변경했습니다`,
      });
    }

    if (input.status !== undefined && input.status !== currentIssue.status) {
      issueUpdates.status = input.status;
      activityEntries.push({
        issueId: currentIssue.id,
        projectId: currentIssue.projectId,
        actorId: input.updatedBy,
        type: "issue.status.updated",
        field: "status",
        from: currentIssue.status,
        to: input.status,
        summary: `상태를 "${currentIssue.status}"에서 "${input.status}"(으)로 변경했습니다`,
      });
    }

    if (
      input.priority !== undefined &&
      input.priority !== currentIssue.priority
    ) {
      issueUpdates.priority = input.priority;
      activityEntries.push({
        issueId: currentIssue.id,
        projectId: currentIssue.projectId,
        actorId: input.updatedBy,
        type: "issue.priority.updated",
        field: "priority",
        from: currentIssue.priority,
        to: input.priority,
        summary: `우선순위를 "${currentIssue.priority}"에서 "${input.priority}"(으)로 변경했습니다`,
      });
    }

    if (
      input.description !== undefined &&
      input.description !== currentIssue.description
    ) {
      issueUpdates.description = input.description;
      activityEntries.push({
        issueId: currentIssue.id,
        projectId: currentIssue.projectId,
        actorId: input.updatedBy,
        type: "issue.description.updated",
        field: "description",
        from: currentIssue.description,
        to: input.description,
        summary: getDescriptionUpdateSummary(
          currentIssue.description,
          input.description
        ),
      });
    }

    if (
      input.assigneeId !== undefined &&
      input.assigneeId !== currentIssue.assigneeId
    ) {
      issueUpdates.assignee_id = input.assigneeId;
      activityEntries.push({
        issueId: currentIssue.id,
        projectId: currentIssue.projectId,
        actorId: input.updatedBy,
        type: "issue.assignee.updated",
        field: "assigneeId",
        from: currentIssue.assigneeId,
        to: input.assigneeId,
        summary: input.assigneeId
          ? "담당자를 배정했습니다"
          : "담당자를 해제했습니다",
      });
    }

    if (input.dueDate !== undefined && input.dueDate !== currentIssue.dueDate) {
      issueUpdates.due_date = input.dueDate;
      const previousDate = currentIssue.dueDate
        ? new Date(currentIssue.dueDate).toLocaleDateString("ko-KR")
        : "없음";
      const newDate = input.dueDate
        ? new Date(input.dueDate).toLocaleDateString("ko-KR")
        : "없음";
      activityEntries.push({
        issueId: currentIssue.id,
        projectId: currentIssue.projectId,
        actorId: input.updatedBy,
        type: "issue.dueDate.updated",
        field: "dueDate",
        from: currentIssue.dueDate,
        to: input.dueDate,
        summary: `마감일을 "${previousDate}"에서 "${newDate}"(으)로 변경했습니다`,
      });
    }

    if (Object.keys(issueUpdates).length === 1) {
      return currentIssue;
    }

    issueUpdates.version = currentIssue.version + 1;

    const { data, error } = await this.client
      .from("issues")
      .update(issueUpdates)
      .eq("id", issueId)
      .eq("version", input.version)
      .select()
      .maybeSingle();

    assertQuerySucceeded("Failed to update issue", error);

    if (!data) {
      const latestIssue = await this.getIssueById(issueId);

      if (!latestIssue) {
        throw createRepositoryError("ISSUE_NOT_FOUND", "Issue not found.");
      }

      const conflictError: ConflictError = {
        currentIssue: latestIssue,
        currentVersion: latestIssue.version,
        message: "This issue has changed since you loaded it.",
        requestedVersion: input.version,
        type: "CONFLICT",
      };

      throw conflictError;
    }

    for (const activityEntry of activityEntries) {
      await this.appendActivityLog(activityEntry);
    }

    const issue = mapIssue(assertDataPresent("Failed to update issue", data));

    return {
      ...issue,
      labels: currentIssue.labels,
    };
  }

  async getIssueById(issueId: string): Promise<Issue | null> {
    const { data, error } = await this.client
      .from("issues")
      .select()
      .eq("id", issueId)
      .maybeSingle();

    assertQuerySucceeded("Failed to load issue", error);

    if (!data) {
      return null;
    }

    const issue = mapIssue(data);

    // 병렬로 관련 데이터 페칭
    const [labels] = await Promise.all([
      this.listIssueLabels(issue.id, issue.projectId),
    ]);

    return {
      ...issue,
      labels,
    };
  }
}
